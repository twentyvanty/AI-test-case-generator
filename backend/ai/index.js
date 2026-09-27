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

// Recommend techniques for a requirement ("Let AI suggest").
export function suggestTechniques({ requirementText }, providers = getProviders()) {
  return runPipeline({
    kind: "TECHNIQUE_SUGGESTION",
    input: { requirementText },
    ...providers,
  });
}

// Step 1 → 2: draft scenarios. `techniques` empty = let the AI choose.
export function draftScenarios({ requirementText, techniques = [] }, providers = getProviders()) {
  return runPipeline({
    kind: "SCENARIOS",
    input: { requirementText, techniques },
    ...providers,
  });
}

// Step 2 → 3: expand the selected scenarios into test cases.
// scenarios: [{ key?, title, description, technique, estimatedCases }]
// Each output test case has scenarioKey = the scenario's key ("S1", "S2", … if not given).
export function generateTestCases(
  { requirementText, techniques = [], scenarios },
  providers = getProviders()
) {
  return runPipeline({
    kind: "TEST_CASES",
    input: {
      requirementText,
      techniques,
      scenarios: scenarios.map((scenario, index) => ({
        ...scenario,
        key: scenario.key ?? `S${index + 1}`,
      })),
    },
    ...providers,
  });
}
