// Defects (Slice 6): POST /defects and PATCH /defects/:defectNumber.
// Create needs a title; every other field is optional. Update needs at least one
// field. Each check returns an error message, or null when the value is fine.

export const DEFECT_SEVERITIES = ["CRITICAL", "MAJOR", "MINOR", "TRIVIAL"];
export const DEFECT_PRIORITIES = ["HIGH", "MEDIUM", "LOW"];
export const DEFECT_STATUSES = ["OPEN", "IN_PROGRESS", "FIXED", "CLOSED"];
export const MAX_DEFECT_TITLE_LENGTH = 255;
export const MAX_DEFECT_NOTES_LENGTH = 5000;

const FIELDS = ["title", "severity", "priority", "status", "testCaseNumber", "openedOn", "closedOn", "notes"];

// "2026-11-14": a real calendar date in YYYY-MM-DD form
export function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const oneOf = (name, value, allowed) =>
  allowed.includes(value) ? null : `${name} must be one of: ${allowed.join(", ")}`;

function checkTitle(title) {
  if (typeof title !== "string" || title.trim() === "") {
    return "Defect title is required";
  }

  return title.trim().length > MAX_DEFECT_TITLE_LENGTH
    ? `Defect title must be at most ${MAX_DEFECT_TITLE_LENGTH} characters`
    : null;
}

function checkFields(body) {
  const checks = [
    ["title", () => checkTitle(body.title)],
    ["severity", () => oneOf("severity", body.severity, DEFECT_SEVERITIES)],
    ["priority", () => oneOf("priority", body.priority, DEFECT_PRIORITIES)],
    ["status", () => oneOf("status", body.status, DEFECT_STATUSES)],
    // null = no linked test case
    [
      "testCaseNumber",
      () =>
        body.testCaseNumber === null || (Number.isInteger(body.testCaseNumber) && body.testCaseNumber > 0)
          ? null
          : "testCaseNumber must be a test case number (1 = TC-0001) or null",
    ],
    ["openedOn", () => (isIsoDate(body.openedOn) ? null : "openedOn must be a date like 2026-11-14")],
    [
      "closedOn",
      () =>
        body.closedOn === null || isIsoDate(body.closedOn)
          ? null
          : "closedOn must be a date like 2026-11-14, or null",
    ],
    [
      "notes",
      () =>
        typeof body.notes !== "string"
          ? "notes must be text"
          : body.notes.length > MAX_DEFECT_NOTES_LENGTH
            ? `notes must be at most ${MAX_DEFECT_NOTES_LENGTH} characters`
            : null,
    ],
  ];

  for (const [field, check] of checks) {
    const message = body[field] !== undefined ? check() : null;

    if (message) {
      return message;
    }
  }

  return null;
}

export function validateCreateDefectDto(data) {
  const body = data ?? {};
  const message = (body.title === undefined ? "Defect title is required" : null) ?? checkFields(body);

  return message ? { valid: false, message } : { valid: true };
}

export function validateUpdateDefectDto(data) {
  const body = data ?? {};

  if (FIELDS.every((field) => body[field] === undefined)) {
    return { valid: false, message: `Send at least one of: ${FIELDS.join(", ")}` };
  }

  const message = checkFields(body);
  return message ? { valid: false, message } : { valid: true };
}
