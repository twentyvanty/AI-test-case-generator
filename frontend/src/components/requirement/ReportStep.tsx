import { useTranslation } from "react-i18next";
import type { Scenario, TestCase } from "../../services/requirements";
import {
  countStatus,
  downloadCaseTable,
  downloadCoverageReport,
  groupByScenario,
} from "../../utils/testCaseExport";
import { formatScenarioCode } from "../../services/requirements";
import CoverageReport, { type CoverageSummary } from "../coverage/CoverageReport";
import Button from "../ui/Button";

type ReportStepProps = {
  requirementNumber: number;
  requirementTitle: string;
  scenarios: Scenario[];
  testCases: TestCase[];
};

// Step 5: coverage & traceability for the requirement (pass rate overall and per
// scenario) with the CSV downloads. Defects join the report in Slice 6.
function ReportStep({ requirementNumber, requirementTitle, scenarios, testCases }: ReportStepProps) {
  const { t } = useTranslation();
  const groups = groupByScenario(scenarios, testCases);
  const passed = countStatus(testCases, "PASS");

  const coverage: CoverageSummary = {
    percent: testCases.length ? Math.round((passed / testCases.length) * 100) : 0,
    areas: groups.map(({ scenario, cases }) => ({
      key: String(scenario.id),
      label: `${formatScenarioCode(scenario.number)} ${scenario.title}`,
      passed: countStatus(cases, "PASS"),
      total: cases.length,
    })),
    passedCases: passed,
    failingCases: countStatus(testCases, "FAIL"),
    mappedCases: groups.reduce((sum, group) => sum + group.cases.length, 0),
  };

  return (
    <CoverageReport title={t("testCasesStep.reportTitle")} coverage={coverage}>
      <Button
        size="lg"
        onClick={() => downloadCoverageReport(requirementNumber, requirementTitle, groups)}
        disabled={testCases.length === 0}
      >
        {t("testCasesStep.downloadReport")}
      </Button>
      <Button
        variant="secondary"
        size="lg"
        onClick={() =>
          downloadCaseTable(requirementNumber, groups, (status) => t(`testCaseStatus.${status}`))
        }
        disabled={testCases.length === 0}
      >
        {t("testCasesStep.downloadTable")}
      </Button>
    </CoverageReport>
  );
}

export default ReportStep;
