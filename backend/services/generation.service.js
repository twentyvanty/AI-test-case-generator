import { Prisma } from "@prisma/client";
import prisma from "../prisma/client.js";
import { draftScenarios, suggestTechniques } from "../ai/index.js";
import { findOwnedRequirement } from "./requirement.service.js";

// Runs the AI pipeline (backend/ai) for a requirement and saves the result as a
// GenerationRun, so every generation is kept for history/restore.
//
// The AI call happens BEFORE the database transaction: it can take a minute or
// more, and a transaction shouldn't stay open that long.

// Optional JSON columns need Prisma.DbNull instead of a plain null
const jsonOrNull = (value) => value ?? Prisma.DbNull;

function runData(requirementId, input, result) {
  return {
    requirementId,
    kind: result.kind,
    status: result.status,
    attempts: result.attempts,
    generatorModel: String(result.generatorModel).slice(0, 100),
    validatorModel: String(result.validatorModel).slice(0, 100),
    input,
    output: jsonOrNull(result.output),
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

// Step 1 → 2: draft scenarios from the saved text + techniques.
// With output (PASSED or NEEDS_REVIEW) the new scenarios REPLACE the old ones.
// FAILED keeps the old scenarios. Returns { run, scenarios }, or null if not found.
export async function draftScenariosFor(keycloakUser, projectId, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return null;
  }

  const input = {
    requirementText: requirement.text,
    techniques: Array.isArray(requirement.techniques) ? requirement.techniques : [],
  };
  const result = await draftScenarios(input);

  return prisma.$transaction(async (tx) => {
    const run = await tx.generationRun.create({
      data: runData(requirement.id, input, result),
    });

    if (result.output) {
      // Deleting the old scenarios also deletes their test cases (cascade)
      await tx.scenario.deleteMany({ where: { requirementId: requirement.id } });

      await tx.scenario.createMany({
        data: result.output.scenarios.map((scenario, index) => ({
          requirementId: requirement.id,
          runId: run.id,
          number: index + 1,
          position: index + 1,
          title: scenario.title,
          description: scenario.description,
          technique: scenario.technique,
          estimatedCases: scenario.estimatedCases,
          selected: true,
          source: "AI",
        })),
      });

      await tx.requirement.update({
        where: { id: requirement.id },
        data: { status: "SCENARIOS_READY" },
      });
    }

    const scenarios = await tx.scenario.findMany({
      where: { requirementId: requirement.id },
      orderBy: { number: "asc" },
    });

    return { run, scenarios };
  });
}
