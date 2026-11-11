// PATCH /test-cases/:testCaseNumber — the status (Open / Pass / Fail) or the
// text the tester edits. Every field is optional; only the ones sent are checked.

export const TEST_CASE_STATUSES = ["OPEN", "PASS", "FAIL"];
export const MAX_TITLE_LENGTH = 255;
export const MAX_TEXT_LENGTH = 2000;
export const MAX_STEPS = 25;
export const MAX_STEP_LENGTH = 1000;

const FIELDS = ["status", "title", "description", "precondition", "steps", "expectedResult"];

function checkText(name, value, { required, max }) {
  if (typeof value !== "string") {
    return `${name} must be a string`;
  }

  if (required && value.trim() === "") {
    return `${name} is required`;
  }

  if (value.trim().length > max) {
    return `${name} must be at most ${max} characters`;
  }

  return null;
}

function checkSteps(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return "steps must be a list with at least one step";
  }

  if (steps.length > MAX_STEPS) {
    return `steps can have at most ${MAX_STEPS} items`;
  }

  if (steps.some((step) => typeof step !== "string" || step.trim() === "")) {
    return "Each step must be non-empty text";
  }

  if (steps.some((step) => step.trim().length > MAX_STEP_LENGTH)) {
    return `Each step must be at most ${MAX_STEP_LENGTH} characters`;
  }

  return null;
}

export function validateUpdateTestCaseDto(data) {
  const body = data ?? {};

  if (FIELDS.every((field) => body[field] === undefined)) {
    return { valid: false, message: `Send at least one of: ${FIELDS.join(", ")}` };
  }

  const message =
    (body.status !== undefined && !TEST_CASE_STATUSES.includes(body.status)
      ? `status must be one of: ${TEST_CASE_STATUSES.join(", ")}`
      : null) ??
    (body.title !== undefined
      ? checkText("Title", body.title, { required: true, max: MAX_TITLE_LENGTH })
      : null) ??
    (body.description !== undefined
      ? checkText("Description", body.description, { required: false, max: MAX_TEXT_LENGTH })
      : null) ??
    (body.precondition !== undefined
      ? checkText("Precondition", body.precondition, { required: false, max: MAX_TEXT_LENGTH })
      : null) ??
    (body.steps !== undefined ? checkSteps(body.steps) : null) ??
    (body.expectedResult !== undefined
      ? checkText("Expected result", body.expectedResult, { required: true, max: MAX_TEXT_LENGTH })
      : null);

  return message ? { valid: false, message } : { valid: true };
}
