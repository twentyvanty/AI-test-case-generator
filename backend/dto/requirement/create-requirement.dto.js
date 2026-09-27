import {
  checkSourceFileName,
  checkTechniques,
  checkText,
  checkTitle,
} from "./requirement-fields.js";

export function validateCreateRequirementDto(data) {
  const { title, text, techniques = [], sourceFileName = null } = data ?? {};

  const message =
    checkTitle(title) ??
    checkText(text) ??
    checkTechniques(techniques) ??
    checkSourceFileName(sourceFileName);

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
