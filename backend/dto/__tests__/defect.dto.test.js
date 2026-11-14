import { test } from "node:test";
import assert from "node:assert/strict";
import { isIsoDate, validateCreateDefectDto, validateUpdateDefectDto } from "../defect/defect.dto.js";

test("a defect needs only a title; every other field is checked when sent", () => {
  assert.deepEqual(validateCreateDefectDto({ title: "Blank code accepted" }), { valid: true });
  assert.equal(validateCreateDefectDto({}).valid, false);
  assert.equal(validateCreateDefectDto({ title: "   " }).valid, false);
  assert.equal(validateCreateDefectDto({ title: "x".repeat(256) }).valid, false);

  const full = {
    title: "Blank code accepted",
    severity: "CRITICAL",
    priority: "HIGH",
    status: "IN_PROGRESS",
    testCaseNumber: 4,
    openedOn: "2026-11-14",
    closedOn: null,
    notes: "Seen on Chrome",
  };
  assert.deepEqual(validateCreateDefectDto(full), { valid: true });

  for (const [field, value] of [
    ["severity", "HIGH"],
    ["priority", "URGENT"],
    ["status", "DONE"],
    ["testCaseNumber", 0],
    ["testCaseNumber", "4"],
    ["openedOn", "14/11/2026"],
    ["closedOn", "2026-02-30"],
    ["notes", 5],
    ["notes", "x".repeat(5001)],
  ]) {
    const result = validateCreateDefectDto({ ...full, [field]: value });
    assert.equal(result.valid, false, `${field} = ${JSON.stringify(value)}`);
    assert.match(result.message, new RegExp(field === "notes" ? "notes" : field), field);
  }
});

test("an edit needs at least one field; null removes the test-case link or the close date", () => {
  assert.equal(validateUpdateDefectDto({}).valid, false);
  assert.deepEqual(validateUpdateDefectDto({ status: "CLOSED" }), { valid: true });
  assert.deepEqual(validateUpdateDefectDto({ testCaseNumber: null, closedOn: null }), { valid: true });
  assert.equal(validateUpdateDefectDto({ title: "" }).valid, false);
});

test("dates are real calendar days in YYYY-MM-DD form", () => {
  assert.equal(isIsoDate("2026-11-14"), true);
  assert.equal(isIsoDate("2028-02-29"), true);
  assert.equal(isIsoDate("2026-02-29"), false);
  assert.equal(isIsoDate("2026-13-01"), false);
  assert.equal(isIsoDate("2026-11-14T00:00:00Z"), false);
  assert.equal(isIsoDate(null), false);
});
