// The test completion report for one requirement (Slice 6c, D-040), built from
// live data. Pure: no database, so every rule is easy to test. The report uses
// codes, not words (NOT_RUN, CRITICAL…), so the page shows it in English or Thai.
//
// Sections, modelled on ISO/IEC/IEEE 29119-3 and ISTQB: header, summary with a
// suggested verdict, results per scenario, traceability (scenario → test cases →
// defects), defects by severity × status, risks to confirm, AI generation info.
// Finalizing (6c-2) saves the report with the tester's conclusion as a version.

import { createHash } from "node:crypto";

export const SEVERITIES = ["CRITICAL", "MAJOR", "MINOR", "TRIVIAL"];
export const DEFECT_STATUSES = ["OPEN", "IN_PROGRESS", "FIXED", "CLOSED"];

const OPEN_DEFECT = ["OPEN", "IN_PROGRESS"];
// An open defect of these severities blocks "Ready"
const BLOCKING_SEVERITIES = ["CRITICAL", "MAJOR"];

// The generator marks a guessed validation rule in the precondition (D-036):
// "Assumed rule (not in the requirement): …"
const ASSUMED_RULE = /assumed rule/i;

const isOpenDefect = (defect) => OPEN_DEFECT.includes(defect.status);
const percent = (part, whole) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

function countStatuses(testCases) {
  const count = (status) => testCases.filter((testCase) => testCase.status === status).length;

  return { total: testCases.length, passed: count("PASS"), failed: count("FAIL"), notRun: count("OPEN") };
}

// A run whose AI notes the tester hasn't marked as reviewed: NEEDS_REVIEW, or
// PASSED with warnings (the same rule as the Step 2 / Step 3 notes)
export function hasUnreviewedNotes(run) {
  if (run.reviewedAt) {
    return false;
  }

  if (run.status === "NEEDS_REVIEW") {
    return true;
  }

  return (
    run.status === "PASSED" &&
    Object.values(run.validation?.final ?? {}).some((check) => check?.status === "warn")
  );
}

// Strict (decided 2026-11-14): "Ready" only when every case was run, none failed
// and no Critical / Major defect is still open. Otherwise the reasons why not.
export function suggestVerdict({ testCases, defects }) {
  const counts = countStatuses(testCases);
  const reasons = [];

  if (counts.total === 0) {
    reasons.push({ code: "NO_TEST_CASES" });
  }

  if (counts.notRun > 0) {
    reasons.push({ code: "NOT_RUN", count: counts.notRun });
  }

  if (counts.failed > 0) {
    reasons.push({ code: "FAILED", count: counts.failed });
  }

  const blocking = defects.filter((defect) => isOpenDefect(defect) && BLOCKING_SEVERITIES.includes(defect.severity));

  if (blocking.length > 0) {
    reasons.push({
      code: "OPEN_SERIOUS_DEFECTS",
      defects: blocking.map(({ number, severity }) => ({ number, severity })),
    });
  }

  return { value: reasons.length === 0 ? "READY" : "NOT_READY", reasons };
}

// What the tester should look at before trusting the result. Only risks that
// apply are listed.
export function findRisks({ scenarios, testCases, defects, runs }) {
  const risks = [];
  const add = (code, items, extra = {}) => items.length > 0 && risks.push({ code, ...extra, items });

  const casesWithDefect = new Set(
    defects.filter((defect) => defect.testCaseNumber !== null).map((defect) => defect.testCaseNumber)
  );

  add(
    "FAILED_WITHOUT_DEFECT",
    testCases.filter((testCase) => testCase.status === "FAIL" && !casesWithDefect.has(testCase.number)).map((testCase) => testCase.number)
  );
  add(
    "NOT_RUN",
    testCases.filter((testCase) => testCase.status === "OPEN").map((testCase) => testCase.number)
  );

  // Scenarios added after the test cases were generated are what makes the cases
  // "out of date" in this app (the scenarios that have cases are locked, D-029)
  const withCases = new Set(testCases.map((testCase) => testCase.scenarioId));
  add(
    "SCENARIOS_WITHOUT_CASES",
    scenarios.filter((scenario) => !withCases.has(scenario.id)).map((scenario) => scenario.number),
    { outOfDate: testCases.length > 0 }
  );

  add(
    "UNREVIEWED_AI_NOTES",
    runs
      .filter((run) => run.kind !== "TEST_DATA_PLAN" && hasUnreviewedNotes(run))
      .map((run) => ({
        kind: run.kind,
        status: run.status,
        // A test-case run is one batch: the scenarios it wrote cases for
        scenarioNumbers: run.kind === "TEST_CASES" ? (run.input?.scenarioNumbers ?? []) : [],
      }))
  );
  add(
    "ASSUMED_RULE",
    testCases.filter((testCase) => ASSUMED_RULE.test(testCase.precondition ?? "")).map((testCase) => testCase.number)
  );

  return risks;
}

// severity → status → count, every cell present (0 when none)
export function defectMatrix(defects) {
  return Object.fromEntries(
    SEVERITIES.map((severity) => [
      severity,
      Object.fromEntries(
        DEFECT_STATUSES.map((status) => [
          status,
          defects.filter((defect) => defect.severity === severity && defect.status === status).length,
        ])
      ),
    ])
  );
}

// Runs, attempts, models and tokens behind what's on screen
export function aiSummary(runs) {
  const content = runs.filter((run) => run.kind !== "TEST_DATA_PLAN");
  const tokens = { input: 0, output: 0 };

  for (const run of runs) {
    for (const role of Object.values(run.usage ?? {})) {
      tokens.input += Number(role?.input) || 0;
      tokens.output += Number(role?.output) || 0;
    }
  }

  const models = (field) => [...new Set(content.map((run) => run[field]).filter(Boolean))];

  return {
    runs: content.length,
    // Every AI call of each run: up to 3 tries of generator + validator
    attempts: content.reduce((sum, run) => sum + (run.attempts ?? 0), 0),
    passedFirstTry: content.filter((run) => run.status === "PASSED" && run.attempts === 1).length,
    needsReview: content.filter((run) => run.status === "NEEDS_REVIEW").length,
    generatorModels: models("generatorModel"),
    validatorModels: models("validatorModel"),
    // Includes the test-data plan calls (D-035)
    tokens,
  };
}

// data: { requirement, projectName, tester, scenarios, testCases, defects, runs, now }
//   scenarios: active, in order; testCases: active, with scenarioId / status /
//   precondition; defects: active, with testCaseNumber (null = not linked);
//   runs: the AI runs behind the current scenarios and test cases (+ plan runs)
export function buildReport({ requirement, projectName, tester, scenarios, testCases, defects, runs, now = new Date() }) {
  const counts = countStatuses(testCases);
  const caseRuns = runs.filter((run) => run.kind === "TEST_CASES");
  const lastCaseRun = caseRuns.reduce((latest, run) => (!latest || run.createdAt > latest.createdAt ? run : latest), null);

  const defectsOf = (testCaseNumber) =>
    defects
      .filter((defect) => defect.testCaseNumber === testCaseNumber)
      .map(({ number, title, severity, status }) => ({ number, title, severity, status }));

  const byScenario = scenarios.map((scenario) => ({
    scenario,
    cases: testCases.filter((testCase) => testCase.scenarioId === scenario.id),
  }));

  return {
    reportedAt: now.toISOString(),
    header: {
      requirementNumber: requirement.number,
      title: requirement.title,
      projectName,
      tester,
      techniques: Array.isArray(requirement.techniques) ? requirement.techniques : [],
      casesGeneratedAt: lastCaseRun ? new Date(lastCaseRun.createdAt).toISOString() : null,
    },
    summary: {
      scenarios: scenarios.length,
      testCases: counts,
      passRate: percent(counts.passed, counts.total),
      executedRate: percent(counts.passed + counts.failed, counts.total),
      defects: {
        total: defects.length,
        open: defects.filter(isOpenDefect).length,
        resolved: defects.filter((defect) => !isOpenDefect(defect)).length,
      },
      verdict: suggestVerdict({ testCases, defects }),
    },
    results: byScenario.map(({ scenario, cases }) => ({
      scenarioNumber: scenario.number,
      title: scenario.title,
      ...countStatuses(cases),
    })),
    traceability: byScenario.map(({ scenario, cases }) => ({
      scenarioNumber: scenario.number,
      title: scenario.title,
      technique: scenario.technique ?? null,
      testCases: cases.map((testCase) => ({
        number: testCase.number,
        title: testCase.title,
        status: testCase.status,
        defects: defectsOf(testCase.number),
      })),
    })),
    defects: {
      bySeverity: defectMatrix(defects),
      notLinked: defects.filter((defect) => defect.testCaseNumber === null).length,
      // Linked to a test case that's in Recently deleted
      onDeletedCases: defects.filter((defect) => defect.testCaseDeleted).length,
    },
    risks: findRisks({ scenarios, testCases, defects, runs }),
    ai: aiSummary(runs),
  };
}

// A short code for the report's content, to tell whether the live report has
// changed since a version was finalized. The report date and the AI info (token
// counts) aren't content, so they're left out.
export function reportFingerprint({ reportedAt: _reportedAt, ai: _ai, ...content }) {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex");
}
