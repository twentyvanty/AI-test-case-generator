// The test completion report (D-040): the tester's conclusion and finalizing.

export const MAX_CONCLUSION_LENGTH = 5000;

function checkConclusion(value) {
  if (typeof value !== "string") {
    return "conclusion must be text";
  }

  if (value.trim().length > MAX_CONCLUSION_LENGTH) {
    return `conclusion must be at most ${MAX_CONCLUSION_LENGTH} characters`;
  }

  return null;
}

// PATCH …/report: { conclusion } (may be empty)
export function validateConclusionDto(data) {
  const body = data ?? {};

  if (body.conclusion === undefined) {
    return { valid: false, message: "Send conclusion" };
  }

  const message = checkConclusion(body.conclusion);

  return message ? { valid: false, message } : { valid: true, value: { conclusion: body.conclusion.trim() } };
}

// POST …/report/finalize: { conclusion?, acceptOpenRisks? }
export function validateFinalizeDto(data) {
  const body = data ?? {};

  const message =
    (body.conclusion !== undefined ? checkConclusion(body.conclusion) : null) ??
    (body.acceptOpenRisks !== undefined && typeof body.acceptOpenRisks !== "boolean"
      ? "acceptOpenRisks must be true or false"
      : null);

  return message
    ? { valid: false, message }
    : {
        valid: true,
        value: {
          conclusion: body.conclusion === undefined ? undefined : body.conclusion.trim(),
          acceptOpenRisks: body.acceptOpenRisks === true,
        },
      };
}
