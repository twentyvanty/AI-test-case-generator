// How long deleted items stay in "Recently deleted" before they're removed for good
export const TRASH_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

// When an item deleted at `deletedAt` is removed for good
export function purgeDate(deletedAt) {
  return new Date(new Date(deletedAt).getTime() + TRASH_DAYS * DAY_MS);
}

// Whole days left before removal (rounded up, never below 0): deleted 2.5 days
// ago → 5 days left
export function daysLeft(deletedAt, now = new Date()) {
  return Math.max(0, Math.ceil((purgeDate(deletedAt).getTime() - now.getTime()) / DAY_MS));
}

// Anything deleted before this moment is due for removal
export function purgeCutoff(now = new Date()) {
  return new Date(now.getTime() - TRASH_DAYS * DAY_MS);
}
