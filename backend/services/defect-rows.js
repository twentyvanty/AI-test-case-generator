// Pure helpers for defects (Slice 6), kept free of the database so they're easy
// to test. Dates travel as "YYYY-MM-DD" strings; the database stores DATE columns.

// Today's date where the server runs, as "YYYY-MM-DD"
export function todayIso(now = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// A DATE column (midnight UTC) → "YYYY-MM-DD"; null stays null
export const toIsoDate = (date) => (date ? date.toISOString().slice(0, 10) : null);

// "YYYY-MM-DD" → the Date Prisma stores in a DATE column; null stays null
export const fromIsoDate = (value) => (value ? new Date(`${value}T00:00:00Z`) : null);

const OPEN_STATUSES = ["OPEN", "IN_PROGRESS"];

// The status and dates a defect ends up with after a create (current = null) or
// an edit. Rules:
// - "opened on" defaults to today
// - becoming CLOSED with no "closed on" → today
// - going back to Open / In progress clears "closed on", unless one was sent
// - "closed on" can't be before "opened on"
// Returns { status, openedOn, closedOn } or { error }.
export function resolveDefectDates(current, changes, today) {
  const status = changes.status ?? current?.status ?? "OPEN";
  const openedOn = changes.openedOn ?? current?.openedOn ?? today;
  let closedOn = changes.closedOn !== undefined ? changes.closedOn : (current?.closedOn ?? null);

  const reopened = changes.status !== undefined && OPEN_STATUSES.includes(status);

  if (reopened && changes.closedOn === undefined) {
    closedOn = null;
  }

  if (status === "CLOSED" && closedOn === null) {
    closedOn = today;
  }

  if (closedOn !== null && closedOn < openedOn) {
    return { error: `"Closed on" (${closedOn}) can't be before "opened on" (${openedOn})` };
  }

  return { status, openedOn, closedOn };
}

// A database row (with testCase { number, deletedAt } included) → the API shape
export function toDefectItem({ testCase, testCaseId: _testCaseId, openedOn, closedOn, ...defect }) {
  return {
    ...defect,
    openedOn: toIsoDate(openedOn),
    closedOn: toIsoDate(closedOn),
    // The linked test case's number, and whether it's in Recently deleted
    testCaseNumber: testCase?.number ?? null,
    testCaseDeleted: testCase ? testCase.deletedAt !== null : false,
  };
}
