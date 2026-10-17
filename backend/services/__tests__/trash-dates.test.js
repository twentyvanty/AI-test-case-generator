import { test } from "node:test";
import assert from "node:assert/strict";
import { daysLeft, purgeCutoff, purgeDate, TRASH_DAYS } from "../trash-dates.js";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-01T12:00:00Z");

test("items are kept for 7 days", () => {
  assert.equal(TRASH_DAYS, 7);
  assert.equal(purgeDate(now).getTime() - now.getTime(), 7 * DAY);
});

test("days left counts partial days as a whole day", () => {
  assert.equal(daysLeft(now, now), 7);
  assert.equal(daysLeft(new Date(now - 2.5 * DAY), now), 5);
  assert.equal(daysLeft(new Date(now - 6.9 * DAY), now), 1);
  assert.equal(daysLeft(new Date(now - 8 * DAY), now), 0);
});

test("the purge removes items deleted more than 7 days ago only", () => {
  const cutoff = purgeCutoff(now);
  const deletedAgo = (days) => new Date(now - days * DAY);

  assert.ok(deletedAgo(8) < cutoff, "8 days ago → removed");
  assert.ok(!(deletedAgo(6) < cutoff), "6 days ago → kept");
});
