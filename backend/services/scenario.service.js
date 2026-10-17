import prisma from "../prisma/client.js";
import { findOwnedRequirement } from "./requirement.service.js";
import { activeScenarios, toScenarioRows } from "./scenario-rows.js";

// Step 2: the tester's own changes to a requirement's scenarios, and the draft
// history. Scenarios are addressed by their number (SC-01 = 1) inside the
// requirement. Every function returns null when the requirement (or scenario)
// isn't found or isn't the user's.

export const HISTORY_SIZE = 10;

function findActiveScenario(requirementId, number) {
  return prisma.scenario.findFirst({
    where: { requirementId, number, deletedAt: null },
  });
}

// A manual scenario, numbered after the current ones
export async function createScenario(keycloakUser, projectId, requirementNumber, data) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);

  if (!requirement) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const { _max } = await tx.scenario.aggregate({
      where: { requirementId: requirement.id, deletedAt: null },
      _max: { number: true },
    });
    const number = (_max.number ?? 0) + 1;

    const scenario = await tx.scenario.create({
      data: {
        requirementId: requirement.id,
        number,
        position: number,
        title: data.title.trim(),
        description: data.description?.trim() ?? "",
        technique: data.technique ?? null,
        priority: data.priority ?? "MEDIUM",
        estimatedCases: data.estimatedCases ?? 1,
        source: "MANUAL",
      },
    });

    // The first scenario unlocks step 2
    if (requirement.status === "DRAFT") {
      await tx.requirement.update({
        where: { id: requirement.id },
        data: { status: "SCENARIOS_READY" },
      });
    }

    return scenario;
  });
}

export async function updateScenario(keycloakUser, projectId, requirementNumber, number, data) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);
  const scenario = requirement && (await findActiveScenario(requirement.id, number));

  if (!scenario) {
    return null;
  }

  return prisma.scenario.update({
    where: { id: scenario.id },
    data: {
      title: data.title?.trim(),
      description: data.description?.trim(),
      technique: data.technique,
      priority: data.priority,
      estimatedCases: data.estimatedCases,
    },
  });
}

// Moves the scenario (and its test cases) to "Recently deleted" for 7 days.
// Returns the requirement's new status; with no scenarios left it's DRAFT again.
export async function deleteScenario(keycloakUser, projectId, requirementNumber, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);
  const scenario = requirement && (await findActiveScenario(requirement.id, number));

  if (!scenario) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    await tx.scenario.update({
      where: { id: scenario.id },
      data: { deletedAt: new Date() },
    });

    const left = await tx.scenario.count({
      where: { requirementId: requirement.id, deletedAt: null },
    });

    if (left > 0) {
      return { status: requirement.status };
    }

    await tx.requirement.update({
      where: { id: requirement.id },
      data: { status: "DRAFT" },
    });

    return { status: "DRAFT" };
  });
}

// The last 10 scenario drafts, newest first (without the full snapshot)
export async function getScenarioRuns(keycloakUser, projectId, requirementNumber) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);

  if (!requirement) {
    return null;
  }

  const runs = await prisma.generationRun.findMany({
    where: { requirementId: requirement.id, kind: "SCENARIOS" },
    orderBy: { createdAt: "desc" },
    take: HISTORY_SIZE,
  });

  return runs.map((run) => ({
    id: run.id,
    createdAt: run.createdAt,
    mode: run.input?.mode === "more" ? "more" : "replace",
    status: run.status,
    attempts: run.attempts,
    scenarioCount: run.output?.scenarios?.length ?? 0,
    generatorModel: run.generatorModel,
    validatorModel: run.validatorModel,
    errorMessage: run.errorMessage,
    restorable: Array.isArray(run.output?.scenarios) && run.output.scenarios.length > 0,
  }));
}

// Replaces the current scenarios with a run's snapshot.
// Returns the scenarios, null if not found, or false if that run has no snapshot.
export async function restoreScenarioRun(keycloakUser, projectId, requirementNumber, runId) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);

  if (!requirement) {
    return null;
  }

  const run = await prisma.generationRun.findFirst({
    where: { id: runId, requirementId: requirement.id, kind: "SCENARIOS" },
  });

  if (!run) {
    return null;
  }

  const snapshot = run.output?.scenarios;

  if (!Array.isArray(snapshot) || snapshot.length === 0) {
    return false;
  }

  return prisma.$transaction(async (tx) => {
    await tx.scenario.deleteMany({ where: { requirementId: requirement.id, deletedAt: null } });
    await tx.scenario.createMany({ data: toScenarioRows(requirement.id, run.id, snapshot) });
    await tx.requirement.update({
      where: { id: requirement.id },
      data: { status: "SCENARIOS_READY" },
    });

    return activeScenarios(tx, requirement.id);
  });
}
