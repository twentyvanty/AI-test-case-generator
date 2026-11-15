import { useTranslation } from "react-i18next";
import type { TestReport } from "../../services/report";
import { formatDefectCode, formatScenarioCode, formatTestCaseCode } from "../../services/requirements";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import { CASE_TONES, SEVERITY_TONES } from "./reportLabels";

// Scenario → its test cases (status) → the defects they found. Scenarios start
// folded when there are many, so the page stays short; printing opens them all.
function ReportTraceability({ traceability }: { traceability: TestReport["traceability"] }) {
  const { t } = useTranslation();
  const startOpen = traceability.length <= 6;

  return (
    <Card padding="md" className="report-section">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">{t("report.traceability.title")}</h2>
      <p className="mt-0.5 text-sm text-gray-500">{t("report.traceability.description")}</p>

      <div className="mt-4 space-y-2">
        {traceability.map((scenario) => {
          const failed = scenario.testCases.filter((testCase) => testCase.status === "FAIL").length;

          return (
            <details
              key={scenario.scenarioNumber}
              open={startOpen}
              className="report-trace group rounded-xl border border-gray-200/80 bg-white/50"
            >
              <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
                <span className="font-mono text-xs text-gray-500">{formatScenarioCode(scenario.scenarioNumber)}</span>
                {/* At least 12rem wide, so on a phone the details wrap onto their own line */}
                <span className="min-w-[12rem] flex-1 text-sm font-medium text-ink">{scenario.title}</span>
                <span className="text-xs text-gray-500">
                  {scenario.technique ? `${t(`techniques.${scenario.technique}`)} · ` : ""}
                  {t("report.traceability.cases", { count: scenario.testCases.length })}
                  {failed > 0 && <span className="text-danger"> · {t("report.traceability.failed", { count: failed })}</span>}
                </span>
                <span aria-hidden="true" className="text-xs text-gray-400 transition group-open:rotate-90 print:hidden">
                  ▸
                </span>
              </summary>

              {scenario.testCases.length === 0 ? (
                <p className="border-t border-gray-200/80 px-4 py-3 text-sm text-gray-500">
                  {t("report.traceability.noCases")}
                </p>
              ) : (
                <ul className="divide-y divide-gray-200/80 border-t border-gray-200/80">
                  {scenario.testCases.map((testCase) => (
                    <li key={testCase.number} className="px-4 py-2.5">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-mono text-xs text-gray-500">{formatTestCaseCode(testCase.number)}</span>
                        <span className="min-w-0 flex-1 text-sm text-gray-700">{testCase.title}</span>
                        <Badge tone={CASE_TONES[testCase.status]}>{t(`testCaseStatus.${testCase.status}`)}</Badge>
                      </div>

                      {testCase.defects.map((defect) => (
                        <p key={defect.number} className="mt-1.5 flex flex-wrap items-center gap-2 pl-4 text-xs text-gray-600">
                          <span aria-hidden="true">↳</span>
                          <span className="font-mono">{formatDefectCode(defect.number)}</span>
                          <span>{defect.title}</span>
                          <Badge tone={SEVERITY_TONES[defect.severity]} className="px-2 py-0.5">
                            {t(`defects.severities.${defect.severity}`)}
                          </Badge>
                          <span className="text-gray-500">{t(`defects.statuses.${defect.status}`)}</span>
                        </p>
                      ))}
                    </li>
                  ))}
                </ul>
              )}
            </details>
          );
        })}
      </div>
    </Card>
  );
}

export default ReportTraceability;
