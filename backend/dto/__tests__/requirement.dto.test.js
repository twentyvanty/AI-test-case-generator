import { test } from "node:test";
import assert from "node:assert/strict";
import { validateCreateRequirementDto } from "../requirement/create-requirement.dto.js";
import { validateUpdateRequirementDto } from "../requirement/update-requirement.dto.js";

const valid = {
  title: "Password reset",
  text: "The reset link expires after 30 minutes.",
  techniques: ["boundaryValue"],
};

test("create: accepts a valid body, techniques optional", () => {
  assert.deepEqual(validateCreateRequirementDto(valid), { valid: true });
  assert.deepEqual(validateCreateRequirementDto({ title: "A", text: "B" }), { valid: true });
});

test("create: title and text are required", () => {
  assert.equal(validateCreateRequirementDto({ ...valid, title: "  " }).message, "Requirement title is required");
  assert.equal(validateCreateRequirementDto({ ...valid, text: undefined }).message, "Requirement details are required");
  assert.equal(validateCreateRequirementDto(undefined).valid, false);
});

test("create: length limits", () => {
  assert.match(validateCreateRequirementDto({ ...valid, title: "x".repeat(256) }).message, /at most 255/);
  assert.match(validateCreateRequirementDto({ ...valid, text: "x".repeat(50_001) }).message, /at most 50000/);
});

test("create: unknown or badly typed techniques are rejected", () => {
  assert.match(validateCreateRequirementDto({ ...valid, techniques: ["tdd"] }).message, /Unknown technique\(s\): tdd/);
  assert.match(validateCreateRequirementDto({ ...valid, techniques: "boundaryValue" }).message, /must be a list/);
});

test("update: needs at least one field, checks only the ones sent", () => {
  assert.equal(validateUpdateRequirementDto({}).valid, false);
  assert.deepEqual(validateUpdateRequirementDto({ techniques: [] }), { valid: true });
  assert.deepEqual(validateUpdateRequirementDto({ sourceFileName: null }), { valid: true });
  assert.equal(validateUpdateRequirementDto({ title: "" }).message, "Requirement title is required");
});
