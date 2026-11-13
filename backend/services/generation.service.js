import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "../prisma/client.js";
import {
  draftScenarios,
  generateTestCases,
  nextTestDataPlan,
  planTestData,
  suggestTechniques,
} from "../ai/index.js";
import { ConflictError } from "./errors.js";
import { findOwnedRequirement } from "./requirement.service.js";
import { refreshStatus } from "./requirement-status.js";
import { activeScenarios, toScenarioRows, toSnapshotItem } from "./scenario-rows.js";
import {
  activeTestCases,
  hasTestCases,
  scenariosWithCounts,
  testCaseCounts,
} from "./test-case.service.js";
import {
  PARALLEL_BATCHES,
  scenariosWithoutCases,
  toAiScenarios,
  toCaseBatches,
  toTestCaseRows,
} from "./test-case-rows.js";

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
// "replace" isn't allowed once test cases exist (D-029) → ConflictError.
// Returns { run, scenarios }, or null if the requirement isn't found.
export async function draftScenariosFor(keycloakUser, projectId, number, mode = "replace") {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return null;
  }

  const existing = await activeScenarios(prisma, requirement.id);

  if (mode !== "more" && (await hasTestCases(prisma, requirement.id))) {
    throw new ConflictError(
      "Scenarios can't be drafted again once test cases exist. Use 'Generate more' or add a scenario instead."
    );
  }
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

    return { run, scenarios: await scenariosWithCounts(tx, requirement.id) };
  });
}

// Step 3: "Generate test cases" for the scenarios that don't have any yet (D-029:
// scenarios with test cases are locked, so their cases are never replaced).
//
// The scenarios go to the AI in small batches (at most MAX_CASES_PER_BATCH
// estimated cases, usually 2–3 scenarios), one run each: on free models a long
// answer runs past the 120 s limit, Thai sooner than English (AI Test Log,
// Test 4). PARALLEL_BATCHES batches are asked at the same time to halve the wait;
// their results are then saved one by one in scenario order, so TC numbers follow
// the scenarios whichever answer came back first.
//
// First, one short AI call writes the test-data plan every batch shares (D-035),
// so all cases use the same records and naming. The plan is saved on the
// requirement and only grows on later clicks; it's cleared when no test cases are
// left (refreshStatus). If planning fails, the batches run without it.
//
// A failed batch stops the generation after its group; batches that passed keep
// their cases, and the scenarios left without cases can simply be generated again.
// New cases continue the numbering (TC-0013, …) — counting deleted ones too, so a
// case in "Recently deleted" can always come back with its own number.
// Returns { run, runs, testCases }: `run` = the first FAILED batch's run if any,
// else the last one; `runs` = every batch's run in scenario order. null if the
// requirement isn't found; ConflictError when every scenario already has cases.
export async function generateTestCasesFor(keycloakUser, projectId, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return null;
  }

  const [scenarios, counts] = await Promise.all([
    activeScenarios(prisma, requirement.id),
    testCaseCounts(prisma, requirement.id),
  ]);
  const pending = scenariosWithoutCases(scenarios, counts);

  if (pending.length === 0) {
    throw new ConflictError(
      scenarios.length === 0
        ? "Add scenarios before generating test cases."
        : "Every scenario already has test cases."
    );
  }

  const batches = toCaseBatches(pending);
  const runs = [];
  // Shared by every batch's run, so History shows one click as one item
  const generationId = randomUUID();
  const testDataPlan = await planFor(requirement, pending, generationId);

  for (let start = 0; start < batches.length; start += PARALLEL_BATCHES) {
    const group = batches.slice(start, start + PARALLEL_BATCHES);
    const answers = await Promise.all(group.map((batch) => askForBatch(requirement, batch, testDataPlan)));

    for (const answer of answers) {
      runs.push(await saveBatch(requirement, answer, generationId));
    }

    if (runs.some((run) => run.status === "FAILED")) {
      break;
    }
  }

  return {
    run: runs.find((run) => run.status === "FAILED") ?? runs.at(-1),
    runs,
    testCases: await activeTestCases(prisma, requirement.id),
  };
}

// The test-data plan for this click: planned for the pending scenarios, added to
// the requirement's existing plan, saved with its own run (kind TEST_DATA_PLAN,
// which History doesn't list). Returns the plan for the batches, or null.
async function planFor(requirement, pending, generationId) {
  const existingPlan = requirement.testDataPlan ?? null;
  const input = {
    requirementText: requirement.text,
    scenarios: toAiScenarios(pending).aiScenarios,
    existingPlan,
  };
  let result;

  try {
    result = await planTestData(input);
  } catch (error) {
    // A bug here must not block the test cases themselves
    console.error("Test-data plan failed:", error);
    return existingPlan;
  }

  const plan = nextTestDataPlan(existingPlan, result);

  await prisma.$transaction([
    prisma.generationRun.create({
      data: runData(
        requirement.id,
        { ...input, scenarioNumbers: pending.map((s) => s.number), generationId },
        result
      ),
    }),
    ...(plan && plan !== existingPlan
      ? [prisma.requirement.update({ where: { id: requirement.id }, data: { testDataPlan: plan } })]
      : []),
  ]);

  return plan;
}

// One batch's AI call (generator + validator, up to 3 attempts). It can take
// minutes, so it runs outside any database transaction.
async function askForBatch(requirement, batch, testDataPlan) {
  const { aiScenarios, scenarioIdByKey } = toAiScenarios(batch);
  const input = {
    requirementText: requirement.text,
    techniques: Array.isArray(requirement.techniques) ? requirement.techniques : [],
    scenarios: aiScenarios,
    ...(testDataPlan && { testDataPlan }),
  };

  return { batch, input, scenarioIdByKey, result: await generateTestCases(input) };
}

// Saves one batch's run and, with output, its test cases numbered after the
// existing ones, in one short transaction. Returns the saved run.
function saveBatch(requirement, { batch, input, scenarioIdByKey, result }, generationId) {
  return prisma.$transaction(async (tx) => {
    const run = await tx.generationRun.create({
      data: runData(
        requirement.id,
        { ...input, scenarioNumbers: batch.map((s) => s.number), generationId },
        result
      ),
    });

    if (result.output) {
      const { _max } = await tx.testCase.aggregate({
        where: { requirementId: requirement.id },
        _max: { number: true },
      });

      await tx.testCase.createMany({
        data: toTestCaseRows({
          requirementId: requirement.id,
          runId: run.id,
          testCases: result.output.testCases,
          scenarioIdByKey,
          firstNumber: (_max.number ?? 0) + 1,
        }),
      });

      await refreshStatus(tx, requirement.id);
    }

    return run;
  });
}
