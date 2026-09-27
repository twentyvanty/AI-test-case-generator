import { test } from "node:test";
import assert from "node:assert/strict";
import { formatZodIssues, scenarioDraftSchema, testCaseSetSchema, toJsonSchema } from "../schemas.js";
import { getProviders } from "../providers/index.js";

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
