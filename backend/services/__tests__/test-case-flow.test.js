import { test } from "node:test";
import assert from "node:assert/strict";
import { refreshStatus, statusFor } from "../requirement-status.js";
import { HISTORY_KINDS } from "../history.service.js";
import {
  scenariosWithoutCases,
  MAX_CASES_PER_BATCH,
  toCaseBatches,
  toAiScenarios,
  toCountMap,
  toTestCaseRows,
} from "../test-case-rows.js";

test("the requirement status follows what it has", () => {
  assert.equal(statusFor({ scenarios: 0, testCases: 0 }, "CASES_READY"), "DRAFT");
  assert.equal(statusFor({ scenarios: 3, testCases: 0 }, "CASES_READY"), "SCENARIOS_READY");
  assert.equal(statusFor({ scenarios: 3, testCases: 5 }, "SCENARIOS_READY"), "CASES_READY");
  assert.equal(statusFor({ scenarios: 3, testCases: 5 }, "REPORTED"), "REPORTED");
});

const scenarios = [
  { id: 10, number: 1, title: "A", description: "a", technique: "boundaryValue", estimatedCases: 3 },
  { id: 11, number: 2, title: "B", description: "b", technique: null, estimatedCases: 0 },
  { id: 12, number: 3, title: "C", description: "c", technique: "stateTransition", estimatedCases: 2 },
];

test("only scenarios without test cases are generated (locked ones are skipped)", () => {
  const counts = toCountMap([{ scenarioId: 10, _count: { _all: 4 } }]);

  assert.deepEqual(
    scenariosWithoutCases(scenarios, counts).map((scenario) => scenario.number),
    [2, 3]
  );
  assert.equal(scenariosWithoutCases(scenarios, new Map()).length, 3);
});

test("scenarios are sent to the AI as S1, S2… and mapped back to their ids", () => {
  const { aiScenarios, scenarioIdByKey } = toAiScenarios(scenarios.slice(1));

  assert.deepEqual(aiScenarios.map((item) => item.key), ["S1", "S2"]);
  assert.equal(aiScenarios[0].estimatedCases, 3, "0 estimated cases → ask for about 3");
  assert.equal("id" in aiScenarios[0], false, "database ids aren't sent to the AI");
  assert.equal(aiScenarios[0].number, 2, "the scenario's own number names the records its cases set up");
  assert.equal(scenarioIdByKey.get("S1"), 11);
  assert.equal(scenarioIdByKey.get("S2"), 12);
});

test("AI test cases become rows numbered after the existing ones, grouped by scenario", () => {
  const { scenarioIdByKey } = toAiScenarios(scenarios.slice(1));
  const testCase = (scenarioKey, title) => ({
    scenarioKey,
    title,
    description: "d",
    precondition: "",
    steps: ["Do it"],
    expectedResult: "Done",
    technique: "boundaryValue",
  });

  const rows = toTestCaseRows({
    requirementId: 7,
    runId: 99,
    testCases: [testCase("S2", "C1"), testCase("S1", "B1"), testCase("S2", "C2")],
    scenarioIdByKey,
    firstNumber: 13,
  });

  assert.deepEqual(
    rows.map((row) => [row.number, row.scenarioId, row.title]),
    [
      [13, 11, "B1"],
      [14, 12, "C1"],
      [15, 12, "C2"],
    ]
  );
  assert.ok(rows.every((row) => row.runId === 99 && row.requirementId === 7 && row.source === "AI"));
});

test("scenarios are batched by estimated test cases, at most 8 per AI request", () => {
  const scenario = (number, estimatedCases) => ({ number, estimatedCases });
  const numbers = (batches) => batches.map((batch) => batch.map((item) => item.number));

  assert.equal(MAX_CASES_PER_BATCH, 8);
  // The Thai timing test: estimates 3, 3, 4, 3, 3, 4, 3, 3 → 2–3 scenarios per batch
  const thai = [3, 3, 4, 3, 3, 4, 3, 3].map((cases, index) => scenario(index + 1, cases));
  assert.deepEqual(numbers(toCaseBatches(thai)), [[1, 2], [3, 4], [5, 6], [7, 8]]);
  // A scenario that alone asks for more than 8 goes in a batch of its own
  assert.deepEqual(numbers(toCaseBatches([scenario(1, 2), scenario(2, 10), scenario(3, 2)])), [[1], [2], [3]]);
  // No estimate counts as 3
  assert.deepEqual(numbers(toCaseBatches([scenario(1, 0), scenario(2, 0), scenario(3, 0)])), [[1, 2], [3]]);
  assert.deepEqual(toCaseBatches([]), []);
});

// A fake transaction holding one requirement and its counts; records updates
function fakeTx({ status, testDataPlan, scenarios, testCases }) {
  const updates = [];

  return {
    updates,
    requirement: {
      findUnique: async () => ({ status, testDataPlan }),
      update: async ({ data }) => updates.push(data),
    },
    scenario: { count: async () => scenarios },
    testCase: { count: async () => testCases },
  };
}

test("the test-data plan is cleared when no test cases are left, and kept otherwise (D-035)", async () => {
  const plan = { conventions: [], records: [] };

  const emptied = fakeTx({ status: "CASES_READY", testDataPlan: plan, scenarios: 2, testCases: 0 });
  assert.equal(await refreshStatus(emptied, 1), "SCENARIOS_READY");
  assert.equal(emptied.updates.length, 1);
  assert.equal(emptied.updates[0].status, "SCENARIOS_READY");
  assert.ok("testDataPlan" in emptied.updates[0], "plan cleared");

  const kept = fakeTx({ status: "CASES_READY", testDataPlan: plan, scenarios: 2, testCases: 4 });
  await refreshStatus(kept, 1);
  assert.deepEqual(kept.updates, [], "nothing changes while test cases exist");

  const noPlan = fakeTx({ status: "SCENARIOS_READY", testDataPlan: null, scenarios: 2, testCases: 0 });
  await refreshStatus(noPlan, 1);
  assert.deepEqual(noPlan.updates, [], "no write when there is no plan to clear");
});

test("History → Generated doesn't list test-data plan runs", () => {
  assert.equal(HISTORY_KINDS.includes("TEST_DATA_PLAN"), false);
});
