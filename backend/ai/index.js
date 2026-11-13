// Public API of the AI module. The rest of the backend should only import from here.
//
// Every function returns a result shaped like the GenerationRun table:
// { kind, status: "PASSED" | "NEEDS_REVIEW" | "FAILED", attempts, output, validation,
//   usage, generatorModel, validatorModel, errorMessage }
//
// `providers` is optional — pass { generator, validator } to override (used in tests).

import { runPipeline } from "./orchestrator.js";
import { getProviders } from "./providers/index.js";

export { TECHNIQUES, TECHNIQUE_KEYS } from "./techniques.js";
export { mergeTestDataPlans, nextTestDataPlan } from "./test-data-plan.js";

// Step 0: read a requirement image into text (vision model). The text goes into
// the editable requirement details; there's no AI validator for it.
// image: { fileName, mimeType, base64 }
export function readRequirementImage({ fileName, mimeType, base64 }, providers = getProviders()) {
  return runPipeline({
    kind: "IMAGE_TEXT",
    input: { fileName, images: [{ mimeType, base64 }] },
    generator: providers.vision,
    validator: providers.validator,
  });
}

// Recommend techniques for a requirement ("Let AI suggest").
export function suggestTechniques({ requirementText }, providers = getProviders()) {
  return runPipeline({
    kind: "TECHNIQUE_SUGGESTION",
    input: { requirementText },
    ...providers,
  });
}

// Step 1 → 2: draft scenarios. `techniques` empty = let the AI choose.
// existingScenarios given ("generate more") → the output holds only NEW scenarios
// that don't overlap them: [{ title, description, technique }]
export function draftScenarios(
  { requirementText, techniques = [], existingScenarios = [] },
  providers = getProviders()
) {
  return runPipeline({
    kind: "SCENARIOS",
    input: {
      requirementText,
      techniques,
      ...(existingScenarios.length > 0 && {
        existingScenarios: existingScenarios.map(({ title, description, technique }) => ({
          title,
          description,
          technique: technique ?? null,
        })),
      }),
    },
    ...providers,
  });
}

// Step 2 → 3, first: one test-data plan shared by every test-case batch (D-035).
// scenarios: [{ title, description, technique }]; existingPlan: the plan earlier
// test cases use (only records are added). No AI validator, like suggestions.
// At most PLAN_MAX_ATTEMPTS tries: the batches wait for it, and without a plan
// they still run as before, so a 3rd try isn't worth the wait.
export const PLAN_MAX_ATTEMPTS = 2;

export function planTestData(
  { requirementText, scenarios, existingPlan = null },
  providers = getProviders()
) {
  return runPipeline({
    kind: "TEST_DATA_PLAN",
    maxAttempts: PLAN_MAX_ATTEMPTS,
    input: {
      requirementText,
      scenarios: scenarios.map(({ title, description, technique }) => ({
        title,
        description,
        technique: technique ?? null,
      })),
      ...(existingPlan && { existingPlan }),
    },
    ...providers,
  });
}

// Step 2 → 3: expand the selected scenarios into test cases.
// scenarios: [{ key?, number?, title, description, technique, estimatedCases }]
// testDataPlan: the shared plan from planTestData (optional).
// Each output test case has scenarioKey = the scenario's key ("S1", "S2", … if not given).
export function generateTestCases(
  { requirementText, techniques = [], scenarios, testDataPlan = null },
  providers = getProviders()
) {
  return runPipeline({
    kind: "TEST_CASES",
    input: {
      requirementText,
      techniques,
      ...(testDataPlan && { testDataPlan }),
      scenarios: scenarios.map((scenario, index) => ({
        ...scenario,
        key: scenario.key ?? `S${index + 1}`,
      })),
    },
    ...providers,
  });
}
