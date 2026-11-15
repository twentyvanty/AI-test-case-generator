import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_CONCLUSION_LENGTH, validateConclusionDto, validateFinalizeDto } from "../report/report.dto.js";

test("conclusion: required, text, trimmed, at most 5000 characters (empty allowed)", () => {
  assert.deepEqual(validateConclusionDto({ conclusion: "  Ready.  " }), { valid: true, value: { conclusion: "Ready." } });
  assert.deepEqual(validateConclusionDto({ conclusion: "" }), { valid: true, value: { conclusion: "" } });
  assert.equal(validateConclusionDto({}).valid, false);
  assert.equal(validateConclusionDto({ conclusion: 5 }).valid, false);
  assert.equal(validateConclusionDto({ conclusion: "x".repeat(MAX_CONCLUSION_LENGTH + 1) }).valid, false);
});

test("finalize: optional conclusion; acceptOpenRisks must be a boolean (default false)", () => {
  assert.deepEqual(validateFinalizeDto(undefined), {
    valid: true,
    value: { conclusion: undefined, acceptOpenRisks: false },
  });
  assert.deepEqual(validateFinalizeDto({ conclusion: " Done ", acceptOpenRisks: true }), {
    valid: true,
    value: { conclusion: "Done", acceptOpenRisks: true },
  });
  assert.equal(validateFinalizeDto({ acceptOpenRisks: "yes" }).valid, false);
  assert.equal(validateFinalizeDto({ conclusion: ["x"] }).valid, false);
});
