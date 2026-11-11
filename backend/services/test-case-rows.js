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

// Map scenarioId → number of active test cases, from a groupBy result
export function toCountMap(groups) {
  return new Map(groups.map((group) => [group.scenarioId, group._count._all]));
}
