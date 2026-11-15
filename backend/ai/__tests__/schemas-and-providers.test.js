import { test } from "node:test";
import assert from "node:assert/strict";
import { formatZodIssues, scenarioDraftSchema, testCaseSetSchema, toJsonSchema } from "../schemas.js";
import { assertRealProvidersInProduction, getProviders } from "../providers/index.js";
import { createMockProvider } from "../providers/mock.provider.js";

test("bad AI output is rejected with readable issues", () => {
  const parsed = scenarioDraftSchema.safeParse({
    scenarios: [{ title: "Only a title", technique: "notATechnique", estimatedCases: 0 }],
  });

  assert.equal(parsed.success, false);

  const issues = formatZodIssues(parsed.error).join("\n");
  assert.match(issues, /scenarios\.0\.description/);
  assert.match(issues, /scenarios\.0\.technique/);
  assert.match(issues, /scenarios\.0\.estimatedCases/);
});

test("the JSON schema sent to the provider leaves out $schema and list-size limits", () => {
  const jsonSchema = toJsonSchema(testCaseSetSchema);
  const text = JSON.stringify(jsonSchema);

  assert.equal(jsonSchema.$schema, undefined);
  assert.equal(jsonSchema.type, "object");
  assert.doesNotMatch(text, /minItems|maxItems/);
  // …but zod still enforces them when checking the answer
  assert.equal(testCaseSetSchema.safeParse({ testCases: [] }).success, false);
});

test("providers default to mock when there's no Gemini key", () => {
  const { generator, validator } = getProviders({});

  assert.equal(generator.model, "mock-generator");
  assert.equal(validator.model, "mock-validator");
});

test("providers default to Gemini with different models when a key is set", () => {
  const { generator, validator } = getProviders({ GEMINI_API_KEY: "test-key" });

  assert.equal(generator.name, "gemini");
  assert.notEqual(generator.model, validator.model);
});

test("generator and validator can use different providers", () => {
  const { generator, validator } = getProviders({
    GEMINI_API_KEY: "test-key",
    AI_VALIDATOR_PROVIDER: "mock",
  });

  assert.equal(generator.name, "gemini");
  assert.equal(validator.name, "mock");
});

test("asking for Gemini without a key gives a clear error", () => {
  assert.throws(() => getProviders({ AI_GENERATOR_PROVIDER: "gemini" }), /GEMINI_API_KEY is not set/);
});

test("an unknown provider name gives a clear error", () => {
  assert.throws(() => getProviders({ AI_GENERATOR_PROVIDER: "gpt" }), /Unknown AI provider "gpt"/);
});

test("production refuses the mock for any role (D-039); development allows it", () => {
  assert.throws(() => assertRealProvidersInProduction({ NODE_ENV: "production" }), /generator, validator, vision/);
  assert.throws(
    () => assertRealProvidersInProduction({ NODE_ENV: "production", OPENROUTER_API_KEY: "k", AI_VALIDATOR_PROVIDER: "mock" }),
    /the validator AI provider would be the mock/
  );
  assert.doesNotThrow(() => assertRealProvidersInProduction({ NODE_ENV: "production", OPENROUTER_API_KEY: "k" }));
  assert.doesNotThrow(() => assertRealProvidersInProduction({ NODE_ENV: "production", GEMINI_API_KEY: "k" }));
  assert.doesNotThrow(() => assertRealProvidersInProduction({}));
  assert.doesNotThrow(() => assertRealProvidersInProduction({ NODE_ENV: "development", AI_GENERATOR_PROVIDER: "mock" }));
});

test("MOCK_DELAY_MS makes the mock generator wait (not the validator)", async () => {
  const task = { kind: "TECHNIQUE_SUGGESTION", input: { requirementText: "Password reset" }, attempt: 1 };
  const slow = createMockProvider({ role: "generator", delayMs: 120 });
  const validator = createMockProvider({ role: "validator", delayMs: 120 });

  let start = Date.now();
  await slow.generateJson({ prompt: "", task });
  assert.ok(Date.now() - start >= 110);
  start = Date.now();
  await validator.generateJson({ prompt: "", task: { ...task, kind: "SCENARIOS" } });
  assert.ok(Date.now() - start < 100);
});

test("scenarios have no priority (removed in D-028); an old answer with one still parses", () => {
  const base = { title: "T", description: "D", technique: "boundaryValue", estimatedCases: 3 };

  assert.equal(scenarioDraftSchema.safeParse({ scenarios: [base] }).success, true);
  const parsed = scenarioDraftSchema.parse({ scenarios: [{ ...base, priority: "high" }] });
  assert.equal("priority" in parsed.scenarios[0], false);
});
