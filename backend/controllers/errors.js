import { ConflictError } from "../services/errors.js";

// Answers known service errors (e.g. 409 for a locked scenario, D-029).
// Returns true when the error was handled.
export function sendKnownError(res, error) {
  if (error instanceof ConflictError) {
    res.status(409).json({ message: error.message });
    return true;
  }

  return false;
}
