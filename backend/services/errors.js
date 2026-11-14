// The request is valid but not allowed in the current state, e.g. editing a
// scenario that already has test cases (D-029). Controllers answer 409.
export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
  }
}

// The request names something that doesn't fit, e.g. a defect linked to a test
// case that isn't in the requirement, or a closing date before the opening date.
// Controllers answer 400.
export class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.name = "BadRequestError";
  }
}
