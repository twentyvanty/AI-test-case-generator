import { test } from "node:test";
import assert from "node:assert/strict";
import { validateUpdateTestCaseDto } from "../test-case/update-test-case.dto.js";

test("a status change alone is fine; unknown statuses are refused", () => {
  assert.deepEqual(validateUpdateTestCaseDto({ status: "PASS" }), { valid: true });
  assert.match(validateUpdateTestCaseDto({ status: "BLOCKED" }).message, /OPEN, PASS, FAIL/);
  assert.match(validateUpdateTestCaseDto({}).message, /at least one/);
});

test("edits: title and expected result required, precondition may be empty", () => {
  assert.deepEqual(
    validateUpdateTestCaseDto({ title: "T", precondition: "", steps: ["a", "b"], expectedResult: "E" }),
    { valid: true }
  );
  assert.equal(validateUpdateTestCaseDto({ title: "  " }).message, "Title is required");
  assert.equal(validateUpdateTestCaseDto({ expectedResult: "" }).message, "Expected result is required");
});

test("steps must be a non-empty list of non-empty text", () => {
  assert.match(validateUpdateTestCaseDto({ steps: [] }).message, /at least one step/);
  assert.match(validateUpdateTestCaseDto({ steps: "do it" }).message, /at least one step/);
  assert.match(validateUpdateTestCaseDto({ steps: ["ok", " "] }).message, /non-empty/);
  assert.match(validateUpdateTestCaseDto({ steps: Array(26).fill("x") }).message, /at most 25/);
});
