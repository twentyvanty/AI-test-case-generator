import { test } from "node:test";
import assert from "node:assert/strict";
import { fromIsoDate, resolveDefectDates, toDefectItem, toIsoDate, todayIso } from "../defect-rows.js";
import { TRASH_TYPES } from "../trash.service.js";

const today = "2026-11-20";

test("a new defect opens today with status Open, unless told otherwise", () => {
  assert.deepEqual(resolveDefectDates(null, {}, today), { status: "OPEN", openedOn: today, closedOn: null });
  assert.deepEqual(resolveDefectDates(null, { openedOn: "2026-11-18", status: "FIXED" }, today), {
    status: "FIXED",
    openedOn: "2026-11-18",
    closedOn: null,
  });
});

test("closing without a date closes today; a date that's sent is kept", () => {
  const open = { status: "OPEN", openedOn: "2026-11-14", closedOn: null };

  assert.equal(resolveDefectDates(open, { status: "CLOSED" }, today).closedOn, today);
  assert.equal(resolveDefectDates(open, { status: "CLOSED", closedOn: "2026-11-15" }, today).closedOn, "2026-11-15");
  // Created as Closed
  assert.equal(resolveDefectDates(null, { status: "CLOSED" }, today).closedOn, today);
  // Fixed isn't closed yet
  assert.equal(resolveDefectDates(open, { status: "FIXED" }, today).closedOn, null);
});

test("reopening clears the close date; other edits keep it", () => {
  const closed = { status: "CLOSED", openedOn: "2026-11-14", closedOn: "2026-11-16" };

  assert.deepEqual(resolveDefectDates(closed, { status: "OPEN" }, today), {
    status: "OPEN",
    openedOn: "2026-11-14",
    closedOn: null,
  });
  assert.equal(resolveDefectDates(closed, { status: "IN_PROGRESS" }, today).closedOn, null);
  assert.equal(resolveDefectDates(closed, { title: "renamed" }, today).closedOn, "2026-11-16");
});

test("the close date can't be before the open date", () => {
  const result = resolveDefectDates(null, { openedOn: "2026-11-14", closedOn: "2026-11-13" }, today);
  assert.match(result.error, /can't be before/);

  // Moving the open date after an existing close date is refused too
  const closed = { status: "CLOSED", openedOn: "2026-11-14", closedOn: "2026-11-16" };
  assert.ok(resolveDefectDates(closed, { openedOn: "2026-11-17" }, today).error);
  // Same day is fine
  assert.equal(resolveDefectDates(closed, { openedOn: "2026-11-16" }, today).error, undefined);
});

test("rows become API items: dates as YYYY-MM-DD, the linked test case by number", () => {
  const row = {
    id: 3,
    number: 2,
    title: "T",
    testCaseId: 40,
    testCase: { number: 4, deletedAt: new Date() },
    openedOn: fromIsoDate("2026-11-14"),
    closedOn: null,
  };
  const item = toDefectItem(row);

  assert.equal(item.openedOn, "2026-11-14");
  assert.equal(item.closedOn, null);
  assert.equal(item.testCaseNumber, 4);
  assert.equal(item.testCaseDeleted, true);
  assert.equal("testCaseId" in item, false);
  assert.equal(toDefectItem({ ...row, testCase: null }).testCaseNumber, null);

  assert.equal(toIsoDate(fromIsoDate("2028-02-29")), "2028-02-29");
  assert.equal(todayIso(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
});

test("defects can go to Recently deleted", () => {
  assert.ok(TRASH_TYPES.includes("defect"));
});
