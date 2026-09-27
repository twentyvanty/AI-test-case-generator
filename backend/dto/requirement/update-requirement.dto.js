import {
  checkSourceFileName,
  checkTechniques,
  checkText,
  checkTitle,
} from "./requirement-fields.js";

// Every field is optional; only the ones sent are checked
export function validateUpdateRequirementDto(data) {
  const { title, text, techniques, sourceFileName } = data ?? {};

  if ([title, text, techniques, sourceFileName].every((value) => value === undefined)) {
    return {
      valid: false,
      message: "Send at least one of: title, text, techniques, sourceFileName",
    };
  }

  const message =
    (title !== undefined ? checkTitle(title) : null) ??
    (text !== undefined ? checkText(text) : null) ??
    (techniques !== undefined ? checkTechniques(techniques) : null) ??
    (sourceFileName !== undefined ? checkSourceFileName(sourceFileName) : null);

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
