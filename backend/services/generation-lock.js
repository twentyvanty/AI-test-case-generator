import { ConflictError } from "./errors.js";

// One AI generation at a time per requirement (D-039). While scenarios or test
// cases are being generated, the requirement carries a "generating" mark: a
// second click is refused with 409, and the page can show "Still generating…"
// after a refresh (the work goes on on the server either way).

// A request is cut off after 10 minutes, so a mark older than this belongs to a
// backend that stopped mid-run and never cleared it: it's ignored.
export const STALE_AFTER_MS = 15 * 60 * 1000;

export const IN_PROGRESS_MESSAGE =
  "A generation is already running for this requirement. Wait for it to finish, then reload the page.";

const isFresh = (since, now) => since !== null && now.getTime() - since.getTime() < STALE_AFTER_MS;

// The running generation for the requirement detail: { kind, since } or null
export function activeGeneration({ generatingKind, generatingSince }, now = new Date()) {
  return generatingKind && isFresh(generatingSince ?? null, now)
    ? { kind: generatingKind, since: generatingSince }
    : null;
}

// Sets the mark in one statement that only matches when there's none (or a stale
// one), so two requests at the same moment can't both start.
// Returns the time it was set; throws ConflictError if another run holds it.
export async function claimGeneration(db, requirementId, kind, now = new Date()) {
  const { count } = await db.requirement.updateMany({
    where: {
      id: requirementId,
      OR: [{ generatingSince: null }, { generatingSince: { lt: new Date(now.getTime() - STALE_AFTER_MS) } }],
    },
    data: { generatingKind: kind, generatingSince: now },
  });

  if (count === 0) {
    throw new ConflictError(IN_PROGRESS_MESSAGE);
  }

  return now;
}

// Clears the mark, but only this run's: a stale mark taken over by a newer run
// stays with that run
export function releaseGeneration(db, requirementId, since) {
  return db.requirement.updateMany({
    where: { id: requirementId, generatingSince: since },
    data: { generatingKind: null, generatingSince: null },
  });
}

// Runs work() holding the mark, and always clears it afterwards (passed, failed
// or crashed). A failed clear is only logged: the mark goes stale on its own.
export async function withGenerationLock(db, requirementId, kind, work) {
  const since = await claimGeneration(db, requirementId, kind);

  try {
    return await work();
  } finally {
    await releaseGeneration(db, requirementId, since).catch((error) =>
      console.error("Failed to clear the generating mark:", error)
    );
  }
}
