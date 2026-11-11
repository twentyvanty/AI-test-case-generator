import {
  checkDescription,
  checkEstimatedCases,
  checkTechnique,
  checkTitle,
} from "./scenario-fields.js";

const FIELDS = ["title", "description", "technique", "estimatedCases"];

// Every field is optional; only the ones sent are checked
export function validateUpdateScenarioDto(data) {
  const body = data ?? {};

  if (FIELDS.every((field) => body[field] === undefined)) {
    return {
      valid: false,
      message: `Send at least one of: ${FIELDS.join(", ")}`,
    };
  }

  const message =
    (body.title !== undefined ? checkTitle(body.title) : null) ??
    (body.description !== undefined ? checkDescription(body.description) : null) ??
    (body.technique !== undefined ? checkTechnique(body.technique) : null) ??
    (body.estimatedCases !== undefined ? checkEstimatedCases(body.estimatedCases) : null);

  if (message) {
    return {
      valid: false,
      message,
    };
  }

  return {
    valid: true,
  };
}
