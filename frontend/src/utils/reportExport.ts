import type { TFunction } from "i18next";
import type { TestReport } from "../services/report";
import {
  formatDefectCode,
  formatRequirementCode,
  formatScenarioCode,
  formatTestCaseCode,
} from "../services/requirements";
import { downloadFile, toCsv } from "./download";

// The report as a CSV (D-040): the header and summary, the risks to confirm, then
// one row per test case with its scenario, status and defects. Labels in the
// interface language, so a Thai report downloads in Thai.
export function downloadReport(report: TestReport, t: TFunction) {
  const { header, summary } = report;
  const code = formatRequirementCode(header.requirementNumber);
  const counts = summary.testCases;
  const blank = [""];

  const rows: (string | number)[][] = [
    [t("report.title"), `${code} ${header.title}`],
    [t("report.header.project"), header.projectName],
    [t("report.header.tester"), header.tester ?? ""],
    [t("report.header.techniques"), header.techniques.map((technique) => t(`techniques.${technique}`)).join(", ")],
    [t("report.header.casesGenerated"), header.casesGeneratedAt?.slice(0, 10) ?? ""],
    [t("report.header.reportDate"), report.reportedAt.slice(0, 16).replace("T", " ")],
    [t("report.verdict.suggested"), t(`report.verdict.${summary.verdict.value}`)],
    [t("report.numbers.cases"), counts.total],
    [t("report.numbers.passed"), counts.passed],
    [t("report.numbers.failed"), counts.failed],
    [t("report.numbers.notRun"), counts.notRun],
    [t("report.numbers.passRate"), `${summary.passRate}%`],
    [t("report.numbers.defects"), t("report.numbers.defectsValue", { open: summary.defects.open, resolved: summary.defects.resolved })],
    blank,
    [t("report.risks.title")],
    ...(report.risks.length === 0
      ? [[t("report.risks.none")]]
      : report.risks.map((risk) => [
          t(`report.risks.${risk.code}`, { count: risk.items.length }),
          risk.code === "UNREVIEWED_AI_NOTES"
            ? risk.items.map((run) => run.scenarioNumbers.map(formatScenarioCode).join(" ") || t("report.risks.scenarioRun")).join("; ")
            : risk.items
                .map((item) => (risk.code === "SCENARIOS_WITHOUT_CASES" ? formatScenarioCode(item) : formatTestCaseCode(item)))
                .join(", "),
        ])),
    blank,
    [
      t("report.csv.scenario"),
      t("report.csv.testCase"),
      t("report.csv.title"),
      t("report.csv.status"),
      t("report.csv.defects"),
    ],
    ...report.traceability.flatMap((scenario) =>
      scenario.testCases.map((testCase) => [
        `${formatScenarioCode(scenario.scenarioNumber)} ${scenario.title}`,
        formatTestCaseCode(testCase.number),
        testCase.title,
        t(`testCaseStatus.${testCase.status}`),
        testCase.defects
          .map(
            (defect) =>
              `${formatDefectCode(defect.number)} (${t(`defects.severities.${defect.severity}`)}, ${t(`defects.statuses.${defect.status}`)})`
          )
          .join("; "),
      ])
    ),
  ];

  downloadFile(`${code}-test-report.csv`, toCsv(rows));
}
