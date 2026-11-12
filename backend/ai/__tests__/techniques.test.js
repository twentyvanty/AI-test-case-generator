import { test } from "node:test";
import assert from "node:assert/strict";
import { TECHNIQUES, TECHNIQUE_KEYS } from "../techniques.js";
import { techniquesBlock } from "../prompts/shared.js";
import { validatePrompt } from "../prompts/validate.js";
import { scenarioDraftSchema } from "../schemas.js";
import { draftScenarios, generateTestCases } from "../index.js";
import { createMockProvider } from "../providers/mock.provider.js";

const mock = () => ({
  generator: createMockProvider({ role: "generator" }),
  validator: createMockProvider({ role: "validator" }),
});

test("seven techniques, each with a name, a description and AI guidance", () => {
  assert.deepEqual(TECHNIQUE_KEYS, [
    "equivalencePartitioning",
    "boundaryValue",
    "decisionTable",
    "stateTransition",
    "syntax",
    "pairwise",
    "useCase",
  ]);

  for (const technique of TECHNIQUES) {
    assert.ok(technique.name && technique.description && technique.guidance, technique.key);
  }
});

test("the new techniques tell the AI when they apply, and the validator how to check them", () => {
  const block = techniquesBlock([]);

  assert.match(block, /syntax \(Syntax testing\): Use ONLY when the requirement defines an input format/);
  assert.match(block, /pairwise \(Combinatorial \(pairwise\) testing\): Use ONLY when/);
  assert.match(block, /useCase \(Use case \(scenario-based\) testing\)/);

  const { system } = validatePrompt("TEST_CASES", { requirementText: "x", techniques: [], scenarios: [] }, { testCases: [] });
  assert.match(system, /syntax testing needs a valid value plus a case breaking each format element/);
  assert.match(system, /pairwise needs every pair of parameter values/);
  assert.match(system, /use case testing needs the main flow plus alternative and exception flows/);
});

test("AI answers may use the new technique keys", () => {
  const scenario = (technique) => ({ title: "T", description: "D", technique, estimatedCases: 3 });

  for (const technique of ["syntax", "pairwise", "useCase"]) {
    assert.equal(scenarioDraftSchema.safeParse({ scenarios: [scenario(technique)] }).success, true, technique);
  }
  assert.equal(scenarioDraftSchema.safeParse({ scenarios: [scenario("randomTesting")] }).success, false);
});

test("every technique works end to end with the mock AI (scenarios, then test cases)", async () => {
  const requirementText =
    "Users register with an email and an ID code of 2 letters + 6 digits. Admins and members can pay by card or transfer. The user fills in the form, confirms and gets a welcome email.";

  for (const technique of TECHNIQUE_KEYS) {
    const draft = await draftScenarios({ requirementText, techniques: [technique] }, mock());
    assert.equal(draft.status, "PASSED", technique);
    assert.ok(draft.output.scenarios.every((scenario) => scenario.technique === technique), technique);

    const scenarios = draft.output.scenarios.map((scenario, index) => ({ ...scenario, key: `S${index + 1}` }));
    const cases = await generateTestCases({ requirementText, techniques: [technique], scenarios }, mock());
    assert.equal(cases.status, "PASSED", `${technique}: ${cases.errorMessage ?? JSON.stringify(cases.validation?.final)}`);
    assert.ok(cases.output.testCases.length > 0, technique);
  }
});
