// Pure helpers for Step 3 (test cases), shared by generation.service.js and
// test-case.service.js. Kept free of the database so they're easy to test.

// Scenarios that have no active test cases yet: the only ones "Generate test
// cases" sends to the AI (D-029: scenarios with test cases are locked).
//   counts: Map scenarioId → number of active test cases
export function scenariosWithoutCases(scenarios, counts) {
  return scenarios.filter((scenario) => !counts.get(scenario.id));
}

// How many test cases one AI request may be asked for. The answer's length is
// what makes a request slow: on free models ~13 cases took 55 s in English but
// 101 s in Thai (the limit is 120 s), and 26 timed out (AI Test Log, Test 4).
export const MAX_CASES_PER_BATCH = 8;

// Batches asked at the same time. Two halve the wait and stay far below
// OpenRouter's 20 requests a minute; more would mostly add "busy" answers from a
// shared free host.
export const PARALLEL_BATCHES = 2;

// A scenario with no estimate counts as 3 cases (what the AI is then asked for)
const casesOf = (scenario) => scenario.estimatedCases || 3;

// Scenarios → batches of at most maxCases estimated test cases, in order. A
// scenario that alone asks for more still goes, in a batch of its own.
// e.g. estimates [3, 3, 4, 3, 9] with 8 → [[3, 3], [4, 3], [9]]
export function toCaseBatches(scenarios, maxCases = MAX_CASES_PER_BATCH) {
  const batches = [];
  let current = [];
  let cases = 0;

  for (const scenario of scenarios) {
    if (current.length > 0 && cases + casesOf(scenario) > maxCases) {
      batches.push(current);
      current = [];
      cases = 0;
    }

    current.push(scenario);
    cases += casesOf(scenario);
  }

  if (current.length > 0) {
    batches.push(current);
  }

  return batches;
}

// DB scenarios → the AI's input, keyed S1, S2, … in order.
// Returns { aiScenarios, scenarioIdByKey }.
export function toAiScenarios(scenarios) {
  const scenarioIdByKey = new Map();

  const aiScenarios = scenarios.map((scenario, index) => {
    const key = `S${index + 1}`;
    scenarioIdByKey.set(key, scenario.id);

    return {
      key,
      // The scenario's own number (S1… restart in every batch): test cases name the
      // records they set up after it, so names never clash across batches (D-035)
      number: scenario.number,
      title: scenario.title,
      description: scenario.description,
      technique: scenario.technique ?? null,
      estimatedCases: casesOf(scenario),
    };
  });

  return { aiScenarios, scenarioIdByKey };
}

// AI test cases → rows for prisma.testCase.createMany, numbered from firstNumber
// (TC-0013, …), grouped by scenario in the order the scenarios were sent.
export function toTestCaseRows({ requirementId, runId, testCases, scenarioIdByKey, firstNumber }) {
  const keys = [...scenarioIdByKey.keys()];
  const ordered = [...testCases].sort(
    (a, b) => keys.indexOf(a.scenarioKey) - keys.indexOf(b.scenarioKey)
  );

  return ordered.map((testCase, index) => ({
    requirementId,
    runId,
    scenarioId: scenarioIdByKey.get(testCase.scenarioKey),
    number: firstNumber + index,
    position: firstNumber + index,
    title: testCase.title,
    description: testCase.description,
    precondition: testCase.precondition ?? "",
    steps: testCase.steps,
    expectedResult: testCase.expectedResult,
    technique: testCase.technique ?? null,
    source: "AI",
  }));
}

// "SC-01", as the frontend shows a scenario number
const scenarioCode = (number) => `SC-${String(number).padStart(2, "0")}`;

// The AI's notes name scenarios by their batch key ("S7", "S1 to S4"), and every
// batch starts again at S1, so a tester can't match them to the screen. Replaces
// each key of this batch with the scenario's real code (S7 → SC-14) in every
// note of the validation. Words that aren't a key of this batch stay as they are.
//   keyToNumber: Map "S1" → scenario number
export function withScenarioCodes(validation, keyToNumber) {
  if (!validation || keyToNumber.size === 0) {
    return validation;
  }

  const rename = (text) =>
    typeof text === "string"
      ? text.replace(/\bS\d+\b/g, (key) => (keyToNumber.has(key) ? scenarioCode(keyToNumber.get(key)) : key))
      : text;

  const renameChecks = (checks) =>
    checks &&
    Object.fromEntries(
      Object.entries(checks).map(([name, check]) => [
        name,
        Array.isArray(check?.issues) ? { ...check, issues: check.issues.map(rename) } : check,
      ])
    );

  return {
    ...validation,
    final: renameChecks(validation.final),
    attempts: (validation.attempts ?? []).map((attempt) => ({ ...attempt, checks: renameChecks(attempt.checks) })),
  };
}

// Map scenarioId → number of active test cases, from a groupBy result
export function toCountMap(groups) {
  return new Map(groups.map((group) => [group.scenarioId, group._count._all]));
}
