import { test } from "node:test";
import assert from "node:assert/strict";
import { aiSummary, buildReport, defectMatrix, findRisks, hasUnreviewedNotes, suggestVerdict } from "../report-builder.js";

const scenario = (id, number = id) => ({ id, number, title: `Scenario ${number}`, technique: "useCase", runId: 1 });
const testCase = (number, scenarioId, status = "PASS", precondition = "") => ({
  id: 100 + number,
  number,
  title: `Case ${number}`,
  scenarioId,
  status,
  precondition,
  runId: 2,
});
const defect = (number, severity, status = "OPEN", testCaseNumber = null, extra = {}) => ({
  number,
  title: `Defect ${number}`,
  severity,
  status,
  testCaseNumber,
  testCaseDeleted: false,
  ...extra,
});
const run = (extra) => ({
  id: 1,
  kind: "TEST_CASES",
  status: "PASSED",
  attempts: 1,
  generatorModel: "gen",
  validatorModel: "val",
  usage: null,
  validation: null,
  reviewedAt: null,
  createdAt: new Date("2026-11-15T03:00:00Z"),
  input: {},
  ...extra,
});

test("verdict is READY only when every case ran, none failed and no Critical/Major defect is open", () => {
  const cases = [testCase(1, 1), testCase(2, 1)];

  assert.deepEqual(suggestVerdict({ testCases: cases, defects: [] }), { value: "READY", reasons: [] });
  // Minor open, and Critical already fixed: still READY
  assert.equal(
    suggestVerdict({ testCases: cases, defects: [defect(1, "MINOR"), defect(2, "CRITICAL", "FIXED")] }).value,
    "READY"
  );
});

test("verdict NOT_READY lists every reason", () => {
  const verdict = suggestVerdict({
    testCases: [testCase(1, 1, "OPEN"), testCase(2, 1, "FAIL"), testCase(3, 1, "FAIL")],
    defects: [defect(1, "CRITICAL", "IN_PROGRESS"), defect(2, "MAJOR"), defect(3, "MINOR")],
  });

  assert.equal(verdict.value, "NOT_READY");
  assert.deepEqual(verdict.reasons, [
    { code: "NOT_RUN", count: 1 },
    { code: "FAILED", count: 2 },
    {
      code: "OPEN_SERIOUS_DEFECTS",
      defects: [
        { number: 1, severity: "CRITICAL" },
        { number: 2, severity: "MAJOR" },
      ],
    },
  ]);
  assert.deepEqual(suggestVerdict({ testCases: [], defects: [] }).reasons, [{ code: "NO_TEST_CASES" }]);
});

test("risks: failed without a defect, not run, scenarios without cases (out of date), assumed rules", () => {
  const risks = findRisks({
    scenarios: [scenario(1), scenario(2), scenario(3)],
    testCases: [
      testCase(1, 1, "FAIL"),
      testCase(2, 1, "FAIL"),
      testCase(3, 2, "OPEN", "Assumed rule (not in the requirement): codes are 3–6 letters"),
      testCase(4, 2, "PASS", "The administrator is logged on"),
    ],
    // TC-2's failure has a defect (even a fixed one counts as logged)
    defects: [defect(1, "MAJOR", "FIXED", 2)],
    runs: [],
  });

  assert.deepEqual(risks, [
    { code: "FAILED_WITHOUT_DEFECT", items: [1] },
    { code: "NOT_RUN", items: [3] },
    { code: "SCENARIOS_WITHOUT_CASES", outOfDate: true, items: [3] },
    { code: "ASSUMED_RULE", items: [3] },
  ]);
});

test("scenarios without cases before any generation aren't 'out of date'; no risks → empty list", () => {
  assert.deepEqual(findRisks({ scenarios: [scenario(1)], testCases: [], defects: [], runs: [] }), [
    { code: "SCENARIOS_WITHOUT_CASES", outOfDate: false, items: [1] },
  ]);
  assert.deepEqual(
    findRisks({ scenarios: [scenario(1)], testCases: [testCase(1, 1)], defects: [], runs: [run()] }),
    []
  );
});

test("unreviewed AI notes: NEEDS_REVIEW, or PASSED with a warning, until marked reviewed", () => {
  const warn = { final: { rules: { status: "warn", issues: ["x"] }, coverage: { status: "pass" } } };

  assert.equal(hasUnreviewedNotes(run({ status: "NEEDS_REVIEW" })), true);
  assert.equal(hasUnreviewedNotes(run({ status: "PASSED", validation: warn })), true);
  assert.equal(hasUnreviewedNotes(run({ status: "PASSED", validation: warn, reviewedAt: new Date() })), false);
  assert.equal(hasUnreviewedNotes(run({ status: "PASSED" })), false);

  const risks = findRisks({
    scenarios: [scenario(1)],
    testCases: [testCase(1, 1)],
    defects: [],
    runs: [
      run({ kind: "SCENARIOS", status: "NEEDS_REVIEW" }),
      run({ kind: "TEST_CASES", validation: warn, input: { scenarioNumbers: [4, 5] } }),
      run({ kind: "TEST_DATA_PLAN", status: "NEEDS_REVIEW" }),
    ],
  });
  assert.deepEqual(risks, [
    {
      code: "UNREVIEWED_AI_NOTES",
      items: [
        { kind: "SCENARIOS", status: "NEEDS_REVIEW", scenarioNumbers: [] },
        { kind: "TEST_CASES", status: "PASSED", scenarioNumbers: [4, 5] },
      ],
    },
  ]);
});

test("defects by severity × status has every cell", () => {
  const matrix = defectMatrix([defect(1, "CRITICAL"), defect(2, "CRITICAL"), defect(3, "MINOR", "CLOSED")]);

  assert.deepEqual(matrix.CRITICAL, { OPEN: 2, IN_PROGRESS: 0, FIXED: 0, CLOSED: 0 });
  assert.deepEqual(matrix.MINOR, { OPEN: 0, IN_PROGRESS: 0, FIXED: 0, CLOSED: 1 });
  assert.deepEqual(Object.keys(matrix), ["CRITICAL", "MAJOR", "MINOR", "TRIVIAL"]);
});

test("AI summary: runs, attempts, models, tokens (plan runs count for tokens only)", () => {
  const usage = { generator: { input: 100, output: 50 }, validator: { input: 30, output: 5 } };
  const summary = aiSummary([
    run({ kind: "SCENARIOS", attempts: 2, usage, generatorModel: "a" }),
    run({ attempts: 1, usage, generatorModel: "b" }),
    run({ attempts: 3, status: "NEEDS_REVIEW", generatorModel: "b" }),
    run({ kind: "TEST_DATA_PLAN", usage: { generator: { input: 10, output: 1 } }, generatorModel: "p" }),
  ]);

  assert.deepEqual(summary, {
    runs: 3,
    attempts: 6,
    passedFirstTry: 1,
    needsReview: 1,
    generatorModels: ["a", "b"],
    validatorModels: ["val"],
    tokens: { input: 270, output: 111 },
  });
});

test("the whole report: header, summary, results and traceability with defects", () => {
  const report = buildReport({
    requirement: { number: 3, title: "School maintenance", techniques: ["useCase"] },
    projectName: "Uni",
    tester: "Nop",
    scenarios: [scenario(1), scenario(2)],
    testCases: [testCase(1, 1, "PASS"), testCase(2, 1, "FAIL"), testCase(3, 2, "OPEN")],
    defects: [
      defect(1, "MAJOR", "OPEN", 2),
      defect(2, "MINOR", "CLOSED", null),
      defect(3, "TRIVIAL", "OPEN", 9, { testCaseDeleted: true }),
    ],
    runs: [run({ createdAt: new Date("2026-11-14T01:00:00Z") }), run({ createdAt: new Date("2026-11-15T02:00:00Z") })],
    now: new Date("2026-11-15T09:00:00Z"),
  });

  assert.equal(report.reportedAt, "2026-11-15T09:00:00.000Z");
  assert.deepEqual(report.header, {
    requirementNumber: 3,
    title: "School maintenance",
    projectName: "Uni",
    tester: "Nop",
    techniques: ["useCase"],
    casesGeneratedAt: "2026-11-15T02:00:00.000Z",
  });
  assert.deepEqual(report.summary.testCases, { total: 3, passed: 1, failed: 1, notRun: 1 });
  assert.equal(report.summary.passRate, 33);
  assert.equal(report.summary.executedRate, 67);
  assert.deepEqual(report.summary.defects, { total: 3, open: 2, resolved: 1 });
  assert.equal(report.summary.verdict.value, "NOT_READY");
  assert.deepEqual(report.results, [
    { scenarioNumber: 1, title: "Scenario 1", total: 2, passed: 1, failed: 1, notRun: 0 },
    { scenarioNumber: 2, title: "Scenario 2", total: 1, passed: 0, failed: 0, notRun: 1 },
  ]);
  assert.deepEqual(report.traceability[0].testCases[1], {
    number: 2,
    title: "Case 2",
    status: "FAIL",
    defects: [{ number: 1, title: "Defect 1", severity: "MAJOR", status: "OPEN" }],
  });
  assert.equal(report.defects.notLinked, 1);
  assert.equal(report.defects.onDeletedCases, 1);
  assert.equal(report.ai.runs, 2);
});
