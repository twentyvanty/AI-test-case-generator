import { test } from "node:test";
import assert from "node:assert/strict";
import { ConflictError } from "../errors.js";
import {
  activeGeneration,
  claimGeneration,
  releaseGeneration,
  STALE_AFTER_MS,
  withGenerationLock,
} from "../generation-lock.js";

// A fake requirement table that applies updateMany's where the way the lock
// uses it: id, generatingSince null / lt / equal
function fakeDb(row = { id: 1, generatingKind: null, generatingSince: null }) {
  const matches = (where) => {
    if (where.id !== row.id) return false;
    if ("generatingSince" in where) return row.generatingSince?.getTime() === where.generatingSince.getTime();
    if (where.OR) {
      return where.OR.some((condition) =>
        condition.generatingSince === null
          ? row.generatingSince === null
          : row.generatingSince !== null && row.generatingSince < condition.generatingSince.lt
      );
    }
    return true;
  };

  return {
    row,
    requirement: {
      async updateMany({ where, data }) {
        if (!matches(where)) return { count: 0 };
        Object.assign(row, data);
        return { count: 1 };
      },
    },
  };
}

const at = (minutes) => new Date(Date.UTC(2026, 10, 15, 10, minutes));

test("claim sets the mark; a second claim is refused with 409 (D-039)", async () => {
  const db = fakeDb();

  await claimGeneration(db, 1, "TEST_CASES", at(0));
  assert.equal(db.row.generatingKind, "TEST_CASES");
  await assert.rejects(claimGeneration(db, 1, "SCENARIOS", at(1)), (error) => error instanceof ConflictError);
  assert.equal(db.row.generatingKind, "TEST_CASES", "the running mark is kept");
});

test("a mark older than 15 minutes is stale: ignored by the detail and taken over by a new run", async () => {
  const db = fakeDb();
  const old = await claimGeneration(db, 1, "SCENARIOS", at(0));

  assert.deepEqual(activeGeneration(db.row, at(14)), { kind: "SCENARIOS", since: at(0) });
  assert.equal(activeGeneration(db.row, new Date(at(0).getTime() + STALE_AFTER_MS)), null);

  const fresh = await claimGeneration(db, 1, "TEST_CASES", at(16));
  // The old run finishing late must not clear the new run's mark
  await releaseGeneration(db, 1, old);
  assert.equal(db.row.generatingKind, "TEST_CASES");
  await releaseGeneration(db, 1, fresh);
  assert.equal(db.row.generatingKind, null);
  assert.equal(activeGeneration(db.row), null);
});

test("withGenerationLock clears the mark after success and after a crash", async () => {
  const db = fakeDb();

  assert.equal(await withGenerationLock(db, 1, "SCENARIOS", async () => "done"), "done");
  assert.equal(db.row.generatingSince, null);

  await assert.rejects(
    withGenerationLock(db, 1, "TEST_CASES", async () => {
      throw new Error("AI crashed");
    }),
    /AI crashed/
  );
  assert.equal(db.row.generatingSince, null, "cleared after the crash too");
});

test("withGenerationLock: a second run while the first works gets 409 and never starts", async () => {
  const db = fakeDb();
  let finish;
  const first = withGenerationLock(db, 1, "TEST_CASES", () => new Promise((resolve) => (finish = resolve)));
  let secondStarted = false;

  await assert.rejects(
    withGenerationLock(db, 1, "TEST_CASES", async () => {
      secondStarted = true;
    }),
    ConflictError
  );
  assert.equal(secondStarted, false);
  finish("cases");
  assert.equal(await first, "cases");
  assert.equal(db.row.generatingSince, null);
});
