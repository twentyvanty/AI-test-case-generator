import { test } from "node:test";
import assert from "node:assert/strict";
import { runPipeline } from "../orchestrator.js";
import { draftScenarios, generateTestCases, suggestTechniques } from "../index.js";
import { createMockProvider } from "../providers/mock.provider.js";
import { ProviderAuthError, ProviderError, ProviderQuotaError } from "../errors.js";

const requirementText =
  "Users must be able to reset their password via email link. The link expires after 30 minutes. Failed attempts are capped at 5 per hour.";

const mock = (failMode = "never") => ({
  generator: createMockProvider({ role: "generator", failMode }),
  validator: createMockProvider({ role: "validator", failMode }),
});

// A provider that answers from a script, one entry per call, and counts calls
function scripted(model, answers) {
  const provider = {
    model,
    calls: 0,
    async generateJson() {
      const answer = answers[Math.min(provider.calls, answers.length - 1)];
      provider.calls++;

      if (answer instanceof Error) {
        throw answer;
      }

      return { data: answer, usage: { input: 10, output: 5 } };
    },
  };

  return provider;
}

const goodScenarios = {
  scenarios: [
    { title: "Link used before 30 minutes", description: "d", technique: "boundaryValue", estimatedCases: 3 },
    { title: "Sixth attempt in an hour", description: "d", technique: "boundaryValue", estimatedCases: 3 },
  ],
};

const passReport = {
  requirementCoverage: { status: "pass", issues: [] },
  techniqueCompliance: { status: "pass", issues: [] },
  rules: { status: "pass", issues: [] },
};

const failReport = {
  ...passReport,
  requirementCoverage: { status: "fail", issues: ["Missing the 5 attempts limit"] },
};

test("passes on the first attempt", async () => {
  const result = await draftScenarios({ requirementText, techniques: ["boundaryValue"] }, mock());

  assert.equal(result.status, "PASSED");
  assert.equal(result.attempts, 1);
  assert.ok(result.output.scenarios.length > 0);
  assert.equal(result.generatorModel, "mock-generator");
  assert.equal(result.validatorModel, "mock-validator");
  assert.deepEqual(Object.keys(result.validation.final), [
    "format",
    "requirementCoverage",
    "techniqueCompliance",
    "rules",
  ]);
  assert.ok(result.usage.generator.input > 0 && result.usage.validator.input > 0);
});

test("retries after malformed output and passes on attempt 2", async () => {
  const result = await draftScenarios({ requirementText, techniques: [] }, mock("once"));

  assert.equal(result.status, "PASSED");
  assert.equal(result.attempts, 2);
  assert.equal(result.validation.attempts[0].passed, false);
  assert.equal(result.validation.attempts[0].checks.format.status, "fail");
  assert.equal(result.validation.attempts[1].passed, true);
});

test("the retry prompt includes the previous attempt's issues", async () => {
  const prompts = [];
  const generator = {
    model: "spy",
    async generateJson({ prompt }) {
      prompts.push(prompt);
      return { data: goodScenarios, usage: {} };
    },
  };
  const validator = scripted("v", [failReport, passReport]);

  const result = await runPipeline({
    kind: "SCENARIOS",
    input: { requirementText, techniques: ["boundaryValue"] },
    generator,
    validator,
  });

  assert.equal(result.status, "PASSED");
  assert.equal(result.attempts, 2);
  assert.doesNotMatch(prompts[0], /previous answer was rejected/);
  assert.match(prompts[1], /Missing the 5 attempts limit/);
});

test("NEEDS_REVIEW after 3 failed validations, returning the best attempt", async () => {
  const result = await draftScenarios({ requirementText, techniques: [] }, mock("always"));

  assert.equal(result.status, "NEEDS_REVIEW");
  assert.equal(result.attempts, 3);
  assert.ok(result.output, "a draft is still returned for manual review");
  assert.ok(result.validation.attempts.every((attempt) => !attempt.passed));
  assert.equal(result.validation.final.requirementCoverage.status, "fail");
  assert.match(result.errorMessage, /review and edit it manually/);
});

test("FAILED straight away on a quota error, without using up retries", async () => {
  const generator = scripted("g", [new ProviderQuotaError("limit")]);
  const validator = scripted("v", [passReport]);

  const result = await runPipeline({
    kind: "SCENARIOS",
    input: { requirementText, techniques: [] },
    generator,
    validator,
  });

  assert.equal(result.status, "FAILED");
  assert.equal(generator.calls, 1);
  assert.equal(result.attempts, 1, "the call that hit the limit still counts as an attempt");
  assert.equal(result.validation.attempts[0].checks.provider.status, "fail");
  assert.equal(result.output, null);
  assert.match(result.errorMessage, /limit/);
});

test("FAILED straight away when the API key is rejected", async () => {
  const generator = scripted("g", [new ProviderAuthError("bad key")]);

  const result = await runPipeline({
    kind: "SCENARIOS",
    input: { requirementText, techniques: [] },
    generator,
    validator: scripted("v", [passReport]),
  });

  assert.equal(result.status, "FAILED");
  assert.equal(generator.calls, 1);
  assert.match(result.errorMessage, /bad key/);
});

test("FAILED when no attempt produced usable output", async () => {
  const generator = scripted("g", [new ProviderError("boom", { code: "INVALID_JSON" })]);
  const validator = scripted("v", [passReport]);

  const result = await runPipeline({
    kind: "SCENARIOS",
    input: { requirementText, techniques: [] },
    generator,
    validator,
  });

  assert.equal(result.status, "FAILED");
  assert.equal(result.attempts, 3);
  assert.equal(validator.calls, 0);
  assert.equal(result.validation.attempts[0].checks.format.status, "fail", "invalid JSON counts as a format failure");
});

test("a validator outage gives NEEDS_REVIEW with the draft, not a silent pass", async () => {
  const generator = scripted("g", [goodScenarios]);
  const validator = scripted("v", [new ProviderQuotaError("validator limit")]);

  const result = await runPipeline({
    kind: "SCENARIOS",
    input: { requirementText, techniques: ["boundaryValue"] },
    generator,
    validator,
  });

  assert.equal(result.status, "NEEDS_REVIEW");
  assert.equal(generator.calls, 1, "no point regenerating when the validator is down");
  assert.equal(result.output.scenarios.length, 2);
  assert.equal(result.validation.final.requirementCoverage.status, "warn");
});

test("scenarios using a technique that wasn't requested fail the format check", async () => {
  const generator = scripted("g", [goodScenarios]);
  const validator = scripted("v", [passReport]);

  const result = await runPipeline({
    kind: "SCENARIOS",
    input: { requirementText, techniques: ["decisionTable"] },
    generator,
    validator,
  });

  assert.equal(result.status, "NEEDS_REVIEW");
  assert.equal(result.validation.final.format.status, "fail");
});

test("test cases are generated for every selected scenario", async () => {
  const drafted = await draftScenarios({ requirementText, techniques: ["boundaryValue"] }, mock());
  const result = await generateTestCases(
    { requirementText, techniques: ["boundaryValue"], scenarios: drafted.output.scenarios },
    mock()
  );

  assert.equal(result.status, "PASSED");

  const keys = new Set(result.output.testCases.map((testCase) => testCase.scenarioKey));
  assert.equal(keys.size, drafted.output.scenarios.length);
});

test("a test case pointing at an unknown scenario fails the format check", async () => {
  const badCases = {
    testCases: [
      {
        scenarioKey: "S9",
        title: "Orphan case",
        description: "d",
        precondition: "",
        steps: ["do it"],
        expectedResult: "ok",
        technique: "boundaryValue",
      },
    ],
  };

  const result = await runPipeline({
    kind: "TEST_CASES",
    input: {
      requirementText,
      techniques: [],
      scenarios: [{ key: "S1", title: "One", description: "", technique: "boundaryValue", estimatedCases: 1 }],
    },
    generator: scripted("g", [badCases]),
    validator: scripted("v", [passReport]),
  });

  assert.equal(result.status, "NEEDS_REVIEW");
  assert.match(result.validation.final.format.issues.join(" "), /unknown scenario "S9"/);
});

test("technique suggestion uses no AI validator", async () => {
  const result = await suggestTechniques({ requirementText }, mock());

  assert.equal(result.status, "PASSED");
  assert.equal(result.validatorModel, "none");
  assert.equal(result.usage.validator.input, 0);
  assert.ok(result.output.suggestions.some((item) => item.technique === "boundaryValue"));
});
