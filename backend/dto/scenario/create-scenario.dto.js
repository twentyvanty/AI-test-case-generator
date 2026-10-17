import {
  checkDescription,
  checkEstimatedCases,
  checkPriority,
  checkTechnique,
  checkTitle,
} from "./scenario-fields.js";

// Only the title is required
export function validateCreateScenarioDto(data) {
  const { title, description = "", technique = null, priority = "MEDIUM", estimatedCases = 1 } =
    data ?? {};

  const message =
    checkTitle(title) ??
    checkDescription(description) ??
    checkTechnique(technique) ??
    checkPriority(priority) ??
    checkEstimatedCases(estimatedCases);

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
