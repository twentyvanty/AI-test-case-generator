import { Prisma } from "@prisma/client";
import prisma from "../prisma/client.js";
import { draftScenarios, suggestTechniques } from "../ai/index.js";
import { findOwnedRequirement } from "./requirement.service.js";
import { activeScenarios, toScenarioRows, toSnapshotItem } from "./scenario-rows.js";

// Runs the AI pipeline (backend/ai) for a requirement and saves the result as a
// GenerationRun, so every generation is kept for history/restore.
//
// The AI call happens BEFORE the database transaction: it can take a minute or
// more, and a transaction shouldn't stay open that long.

// Optional JSON columns need Prisma.DbNull instead of a plain null
const jsonOrNull = (value) => value ?? Prisma.DbNull;

function runData(requirementId, input, result, output = result.output) {
  return {
    requirementId,
    kind: result.kind,
    status: result.status,
    attempts: result.attempts,
    generatorModel: String(result.generatorModel).slice(0, 100),
    validatorModel: String(result.validatorModel).slice(0, 100),
    input,
    output: jsonOrNull(output),
    validation: jsonOrNull(result.validation),
    usage: jsonOrNull(result.usage),
    errorMessage: result.errorMessage,
  };
}

// "Let AI suggest": null = requirement not found (or not the user's)
export async function suggestTechniquesFor(keycloakUser, projectId, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return null;
  }

  const input = { requirementText: requirement.text };
  const result = await suggestTechniques(input);

  return prisma.generationRun.create({
    data: runData(requirement.id, input, result),
  });
}

// Draft scenarios from the saved text + techniques.
//   mode "replace": the new scenarios REPLACE the current ones (numbered from SC-01)
//   mode "more":    the AI adds NEW scenarios after the current ones (SC-07, SC-08…)
// With output (PASSED or NEEDS_REVIEW) the scenarios are saved; FAILED changes nothing.
// The run stores a snapshot of the full list afterwards, for restore.
// Returns { run, scenarios }, or null if the requirement isn't found.
export async function draftScenariosFor(keycloakUser, projectId, number, mode = "replace") {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return null;
  }

  const existing = await activeScenarios(prisma, requirement.id);
  // "more" with nothing to add to is just a normal draft
  const more = mode === "more" && existing.length > 0;

  const input = {
    requirementText: requirement.text,
    techniques: Array.isArray(requirement.techniques) ? requirement.techniques : [],
    ...(more && { existingScenarios: existing.map(toSnapshotItem) }),
  };
  const result = await draftScenarios(input);

  const added = result.output?.scenarios ?? [];
  const kept = more ? existing.map(toSnapshotItem) : [];
  const snapshot = result.output ? { scenarios: [...kept, ...added.map(toSnapshotItem)] } : null;

  return prisma.$transaction(async (tx) => {
    const run = await tx.generationRun.create({
      data: runData(requirement.id, { ...input, mode: more ? "more" : "replace" }, result, snapshot),
    });

    if (result.output) {
      if (!more) {
        // Replaced for good — the run history keeps the old versions. (Scenarios
        // already in "Recently deleted" stay there.)
        await tx.scenario.deleteMany({ where: { requirementId: requirement.id, deletedAt: null } });
      }

      const firstNumber = more ? Math.max(...existing.map((item) => item.number)) + 1 : 1;

      await tx.scenario.createMany({
        data: toScenarioRows(requirement.id, run.id, added, firstNumber),
      });

      await tx.requirement.update({
        where: { id: requirement.id },
        data: { status: "SCENARIOS_READY" },
      });
    }

    return { run, scenarios: await activeScenarios(tx, requirement.id) };
  });
}
