import { TECHNIQUE_KEYS } from "../../ai/index.js";

export const MAX_TITLE_LENGTH = 255;
export const MAX_TEXT_LENGTH = 50_000;
export const MAX_FILE_NAME_LENGTH = 255;

// Each check returns an error message, or null when the value is fine.
// Used by both the create and the update DTO.

export function checkTitle(title) {
  if (typeof title !== "string" || title.trim() === "") {
    return "Requirement title is required";
  }

  if (title.trim().length > MAX_TITLE_LENGTH) {
    return `Requirement title must be at most ${MAX_TITLE_LENGTH} characters`;
  }

  return null;
}

export function checkText(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return "Requirement details are required";
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return `Requirement details must be at most ${MAX_TEXT_LENGTH} characters`;
  }

  return null;
}

// An empty list means "let the AI choose"
export function checkTechniques(techniques) {
  if (!Array.isArray(techniques)) {
    return "Techniques must be a list of technique keys";
  }

  const unknown = techniques.filter((key) => !TECHNIQUE_KEYS.includes(key));

  if (unknown.length > 0) {
    return `Unknown technique(s): ${unknown.join(", ")}. Allowed: ${TECHNIQUE_KEYS.join(", ")}`;
  }

  return null;
}

export function checkSourceFileName(sourceFileName) {
  if (sourceFileName === null) {
    return null;
  }

  if (typeof sourceFileName !== "string") {
    return "Source file name must be a string";
  }

  if (sourceFileName.length > MAX_FILE_NAME_LENGTH) {
    return `Source file name must be at most ${MAX_FILE_NAME_LENGTH} characters`;
  }

  return null;
}
