import prisma from "../prisma/client.js";
import { ConflictError } from "./errors.js";
import { findOwnedRequirement } from "./requirement.service.js";
import { refreshStatus } from "./requirement-status.js";
import { toScenarioRows } from "./scenario-rows.js";
import { hasTestCases, scenariosWithCounts } from "./test-case.service.js";

// Step 2: the tester's own changes to a requirement's scenarios, and the draft
// history. Scenarios are addressed by their number (SC-01 = 1) inside the
// requirement. Every function returns null when the requirement (or scenario)
// isn't found or isn't the user's.
//
// D-029: a scenario with active test cases is LOCKED — it can't be edited, and the
// list can't be replaced (redraft / restore). It can still be deleted, which takes
// its test cases with it.

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
        estimatedCases: data.estimatedCases ?? 1,
        source: "MANUAL",
      },
    });

    // The first scenario unlocks step 2
    await refreshStatus(tx, requirement.id);

    return { ...scenario, testCaseCount: 0 };
  });
}

export async function updateScenario(keycloakUser, projectId, requirementNumber, number, data) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);
  const scenario = requirement && (await findActiveScenario(requirement.id, number));

  if (!scenario) {
    return null;
  }

  const testCaseCount = await prisma.testCase.count({
    where: { scenarioId: scenario.id, deletedAt: null },
  });

  if (testCaseCount > 0) {
    throw new ConflictError(
      `This scenario has ${testCaseCount} test case(s), so it can't be edited. Delete it (its test cases go with it) and add a new one instead.`
    );
  }

  const updated = await prisma.scenario.update({
    where: { id: scenario.id },
    data: {
      title: data.title?.trim(),
      description: data.description?.trim(),
      technique: data.technique,
      estimatedCases: data.estimatedCases,
    },
  });

  return { ...updated, testCaseCount: 0 };
}

// Moves the scenario AND its test cases to "Recently deleted" for 7 days; restoring
// the scenario brings exactly those cases back (deletedWithScenario).
// Returns the requirement's new status (DRAFT when no scenarios are left) and how
// many test cases went with it.
export async function deleteScenario(keycloakUser, projectId, requirementNumber, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);
  const scenario = requirement && (await findActiveScenario(requirement.id, number));

  if (!scenario) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const deletedAt = new Date();

    await tx.scenario.update({
      where: { id: scenario.id },
      data: { deletedAt },
    });

    const { count } = await tx.testCase.updateMany({
      where: { scenarioId: scenario.id, deletedAt: null },
      data: { deletedAt, deletedWithScenario: true },
    });

    return { status: await refreshStatus(tx, requirement.id), deletedTestCases: count };
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
    reviewedAt: run.reviewedAt,
    attempts: run.attempts,
    scenarioCount: run.output?.scenarios?.length ?? 0,
    generatorModel: run.generatorModel,
    validatorModel: run.validatorModel,
    errorMessage: run.errorMessage,
    restorable: Array.isArray(run.output?.scenarios) && run.output.scenarios.length > 0,
  }));
}

// Replaces the current scenarios with a run's snapshot. Not allowed once test
// cases exist (D-029) → ConflictError.
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

  if (await hasTestCases(prisma, requirement.id)) {
    throw new ConflictError(
      "An earlier draft can't be restored once test cases exist, because it would replace scenarios that have test cases."
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.scenario.deleteMany({ where: { requirementId: requirement.id, deletedAt: null } });
    await tx.scenario.createMany({ data: toScenarioRows(requirement.id, run.id, snapshot) });
    await refreshStatus(tx, requirement.id);

    return scenariosWithCounts(tx, requirement.id);
  });
}

// "Mark as reviewed" on a scenario or test-case run that needs review: its note is
// hidden from then on. Returns { id, reviewedAt }, or null if not found.
export async function markRunReviewed(keycloakUser, projectId, requirementNumber, runId) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);

  if (!requirement) {
    return null;
  }

  const run = await prisma.generationRun.findFirst({
    where: { id: runId, requirementId: requirement.id, kind: { in: ["SCENARIOS", "TEST_CASES"] } },
  });

  if (!run) {
    return null;
  }

  return prisma.generationRun.update({
    where: { id: run.id },
    data: { reviewedAt: run.reviewedAt ?? new Date() },
    select: { id: true, reviewedAt: true },
  });
}
