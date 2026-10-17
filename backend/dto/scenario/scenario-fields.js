import { TECHNIQUE_KEYS } from "../../ai/index.js";

export const MAX_TITLE_LENGTH = 255;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_ESTIMATED_CASES = 20;
export const PRIORITIES = ["HIGH", "MEDIUM", "LOW"];

// Each check returns an error message, or null when the value is fine.
// Used by both the create and the update DTO.

export function checkTitle(title) {
  if (typeof title !== "string" || title.trim() === "") {
    return "Scenario title is required";
  }

  if (title.trim().length > MAX_TITLE_LENGTH) {
    return `Scenario title must be at most ${MAX_TITLE_LENGTH} characters`;
  }

  return null;
}

export function checkDescription(description) {
  if (typeof description !== "string") {
    return "Scenario description must be a string";
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return `Scenario description must be at most ${MAX_DESCRIPTION_LENGTH} characters`;
  }

  return null;
}

// null = no technique
export function checkTechnique(technique) {
  if (technique === null || TECHNIQUE_KEYS.includes(technique)) {
    return null;
  }

  return `Unknown technique "${technique}". Allowed: ${TECHNIQUE_KEYS.join(", ")} or null`;
}

export function checkPriority(priority) {
  return PRIORITIES.includes(priority) ? null : `Priority must be one of: ${PRIORITIES.join(", ")}`;
}

export function checkEstimatedCases(estimatedCases) {
  if (
    !Number.isInteger(estimatedCases) ||
    estimatedCases < 0 ||
    estimatedCases > MAX_ESTIMATED_CASES
  ) {
    return `Estimated cases must be a whole number from 0 to ${MAX_ESTIMATED_CASES}`;
  }

  return null;
}
