import {
  formatRequirementCode,
  formatScenarioCode,
  formatTestCaseCode,
  type Scenario,
  type TestCase,
  type TestCaseStatus,
} from "../services/requirements";
import { downloadFile, toCsv } from "./download";

// Shared by Step 3 (test case table) and Step 5 (report): the scenarios that have
// test cases, in scenario order, and the CSV downloads.

export type CaseGroup = { scenario: Scenario; cases: TestCase[] };

export const countStatus = (cases: TestCase[], status: TestCaseStatus) =>
  cases.filter((item) => item.status === status).length;

export function groupByScenario(scenarios: Scenario[], testCases: TestCase[]): CaseGroup[] {
  return scenarios
    .map((scenario) => ({
      scenario,
      cases: testCases.filter((item) => item.scenarioId === scenario.id),
    }))
    .filter((group) => group.cases.length > 0);
}

// statusLabel: the translated "Open / Pass / Fail"
export function downloadCaseTable(
  requirementNumber: number,
  groups: CaseGroup[],
  statusLabel: (status: TestCaseStatus) => string
) {
  downloadFile(
    `${formatRequirementCode(requirementNumber)}-test-cases.csv`,
    toCsv([
      ["ID", "Scenario", "Title", "Precondition", "Steps", "Expected result", "Status"],
      ...groups.flatMap(({ scenario, cases }) =>
        cases.map((item) => [
          formatTestCaseCode(item.number),
          `${formatScenarioCode(scenario.number)} ${scenario.title}`,
          item.title,
          item.precondition,
          item.steps.map((step, index) => `${index + 1}. ${step}`).join("\n"),
          item.expectedResult,
          statusLabel(item.status),
        ])
      ),
    ])
  );
}

export function downloadCoverageReport(
  requirementNumber: number,
  requirementTitle: string,
  groups: CaseGroup[]
) {
  const code = formatRequirementCode(requirementNumber);
  const all = groups.flatMap((group) => group.cases);
  const passed = countStatus(all, "PASS");
  const percent = (part: number, total: number) => `${total ? Math.round((part / total) * 100) : 0}%`;

  downloadFile(
    `${code}-coverage-report.csv`,
    toCsv([
      [`${code} ${requirementTitle}`, "", "", ""],
      ["Scenario", "Passed", "Total", "Coverage"],
      ...groups.map(({ scenario, cases }) => [
        `${formatScenarioCode(scenario.number)} ${scenario.title}`,
        countStatus(cases, "PASS"),
        cases.length,
        percent(countStatus(cases, "PASS"), cases.length),
      ]),
      ["All test cases", passed, all.length, percent(passed, all.length)],
      ["Failing cases", countStatus(all, "FAIL"), "", ""],
    ])
  );
}
