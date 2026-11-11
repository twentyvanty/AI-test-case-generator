import { test } from "node:test";
import assert from "node:assert/strict";
import { groupRuns, producedCount, SAME_CLICK_MS } from "../history.service.js";

test("history counts what a run produced (Generate more subtracts the kept scenarios)", () => {
  const list = (n) => Array.from({ length: n }, () => ({}));

  assert.equal(producedCount({ kind: "TEST_CASES", output: { testCases: list(8) } }), 8);
  assert.equal(producedCount({ kind: "SCENARIOS", input: { mode: "replace" }, output: { scenarios: list(6) } }), 6);
  assert.equal(
    producedCount({ kind: "SCENARIOS", input: { mode: "more", existingScenarios: list(6) }, output: { scenarios: list(8) } }),
    2
  );
  assert.equal(producedCount({ kind: "SCENARIOS", input: {}, output: null }), 0);
});

const at = (minute) => new Date(Date.UTC(2026, 10, 12, 1, minute));
const run = (id, extra) => ({
  id,
  kind: "TEST_CASES",
  status: "PASSED",
  requirementId: 4,
  generationId: null,
  mode: null,
  itemCount: 6,
  createdAt: at(0),
  projectId: 1,
  projectName: "P",
  requirementNumber: 4,
  requirementTitle: "R",
  ...extra,
});

test("one click's batch runs become one History item (same generation id)", () => {
  // newest first, as the database returns them
  const items = groupRuns([
    run(12, { generationId: "b", itemCount: 4, createdAt: at(30) }),
    run(11, { generationId: "a", itemCount: 4, createdAt: at(3), status: "NEEDS_REVIEW" }),
    run(10, { generationId: "a", itemCount: 8, createdAt: at(1) }),
    run(9, { generationId: "a", itemCount: 6, createdAt: at(1) }),
  ]);

  assert.equal(items.length, 2);
  assert.deepEqual(items[1].runIds, [9, 10, 11]);
  assert.equal(items[1].itemCount, 18);
  assert.equal(items[1].status, "NEEDS_REVIEW", "needs review if any batch does");
  assert.equal(items[1].id, 9);
  assert.equal(items[1].createdAt.getTime(), at(3).getTime(), "finished when its last batch did");
});

test("older runs without a generation id are grouped when they finished close together", () => {
  const items = groupRuns([
    run(6, { createdAt: at(20) }), // a later click
    run(5, { createdAt: at(1) }),
    run(4, { createdAt: at(0) }),
    run(3, { createdAt: at(0), requirementId: 7, requirementNumber: 7 }), // another requirement
    run(2, { kind: "SCENARIOS", mode: "replace", createdAt: at(0) }), // scenario runs never merge
    run(1, { kind: "SCENARIOS", mode: "more", createdAt: at(0) }),
  ]);

  assert.deepEqual(items.map((item) => item.runIds), [[6], [4, 5], [3], [2], [1]]);
  assert.ok(SAME_CLICK_MS >= 2 * 60 * 1000);
});
