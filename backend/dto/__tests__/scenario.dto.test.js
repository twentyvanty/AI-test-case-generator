import { test } from "node:test";
import assert from "node:assert/strict";
import { validateCreateScenarioDto } from "../scenario/create-scenario.dto.js";
import { validateUpdateScenarioDto } from "../scenario/update-scenario.dto.js";

test("create: only the title is required", () => {
  assert.deepEqual(validateCreateScenarioDto({ title: "Holiday transfer" }), { valid: true });
  assert.equal(validateCreateScenarioDto({}).message, "Scenario title is required");
});

test("create: technique and estimated cases are checked", () => {
  const base = { title: "T" };

  assert.deepEqual(validateCreateScenarioDto({ ...base, technique: null }), { valid: true });
  assert.match(validateCreateScenarioDto({ ...base, technique: "tdd" }).message, /Unknown technique/);
  assert.match(validateCreateScenarioDto({ ...base, estimatedCases: 21 }).message, /0 to 20/);
  assert.match(validateCreateScenarioDto({ ...base, estimatedCases: 1.5 }).message, /whole number/);
});

test("update: needs at least one field; one field alone is fine", () => {
  assert.equal(validateUpdateScenarioDto({}).valid, false);
  // priority was removed (D-028): sending only it is "no fields"
  assert.equal(validateUpdateScenarioDto({ priority: "LOW" }).valid, false);
  assert.deepEqual(validateUpdateScenarioDto({ estimatedCases: 2 }), { valid: true });
  assert.deepEqual(validateUpdateScenarioDto({ technique: null }), { valid: true });
  assert.equal(validateUpdateScenarioDto({ title: " " }).message, "Scenario title is required");
});
