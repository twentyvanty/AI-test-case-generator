import { fromIssues, pass } from "./result.js";

// Checks that need the input as well as the output (part of the "format" check).
export function checkStructure(kind, output, input) {
  if (kind === "SCENARIOS") {
    const allowed = input.techniques ?? [];

    // If the tester picked techniques, scenarios must use only those
    if (allowed.length === 0) {
      return pass();
    }

    const failures = output.scenarios
      .filter((scenario) => !allowed.includes(scenario.technique))
      .map(
        (scenario) =>
          `Scenario "${scenario.title}" uses technique "${scenario.technique}", which wasn't requested (allowed: ${allowed.join(", ")})`
      );

    return fromIssues({ failures });
  }

  if (kind === "TEST_CASES") {
    const keys = input.scenarios.map((scenario) => scenario.key);
    const failures = [];

    for (const testCase of output.testCases) {
      if (!keys.includes(testCase.scenarioKey)) {
        failures.push(
          `Test case "${testCase.title}" refers to unknown scenario "${testCase.scenarioKey}" (valid: ${keys.join(", ")})`
        );
      }
    }

    for (const scenario of input.scenarios) {
      if (!output.testCases.some((testCase) => testCase.scenarioKey === scenario.key)) {
        failures.push(`Scenario ${scenario.key} "${scenario.title}" has no test cases`);
      }
    }

    return fromIssues({ failures });
  }

  return pass();
}
