import { useTranslation } from "react-i18next";
import {
  allCases,
  summarizeCoverage,
  type Requirement,
  type TestCaseStatus,
} from "../../services/requirements";
import {
  coverageReportToMarkdown,
  downloadFile,
  testCasesToCsv,
} from "../../utils/exporters";
import CoverageReport from "../coverage/CoverageReport";
import Button from "../ui/Button";
import Card from "../ui/Card";

const STATUSES: TestCaseStatus[] = ["pass", "fail", "open"];

type ValidateStepProps = {
  requirement: Requirement;
  onChange: (requirement: Requirement) => void;
  onBack: () => void;
};

function ValidateStep({ requirement, onChange, onBack }: ValidateStepProps) {
  const { t } = useTranslation();
  const cases = allCases(requirement.scenarios);
  const coverage = summarizeCoverage(requirement.scenarios);

  const setStatus = (caseId: string, status: TestCaseStatus) =>
    onChange({
      ...requirement,
      scenarios: requirement.scenarios.map((scenario) => ({
        ...scenario,
        cases: scenario.cases.map((testCase) =>
          testCase.id === caseId ? { ...testCase, status } : testCase
        ),
      })),
    });

  const downloadTable = () =>
    downloadFile(
      `${requirement.id}-test-cases.csv`,
      testCasesToCsv(requirement),
      "text/csv;charset=utf-8"
    );

  const downloadReport = () =>
    downloadFile(
      `${requirement.id}-coverage-report.md`,
      coverageReportToMarkdown(requirement),
      "text/markdown;charset=utf-8"
    );

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <Card padding="md" className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">
              {t("validate.title")}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {t("requirements.caseCount", { count: cases.length })}
              {" · "}
              {t("validate.passCount", { count: coverage.passedCases })}
              {" · "}
              {t("validate.failCount", { count: coverage.failingCases })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onBack}>
              <span aria-hidden="true">←</span> {t("validate.backToScenarios")}
            </Button>
            <Button variant="brand" size="sm" onClick={downloadTable}>
              {t("validate.downloadTable")}
            </Button>
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-track/70 px-4 py-2 text-sm text-gray-600">
          {t("validate.exportNote")}
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left align-top text-sm">
            <thead>
              <tr className="border-b border-gray-200/80 text-xs uppercase tracking-wider text-gray-500">
                <th className="py-2 pr-2 font-medium">{t("validate.columns.id")}</th>
                <th className="py-2 pr-2 font-medium">{t("validate.columns.title")}</th>
                <th className="py-2 pr-2 font-medium">{t("validate.columns.precondition")}</th>
                <th className="py-2 pr-2 font-medium">{t("validate.columns.steps")}</th>
                <th className="py-2 pr-2 font-medium">{t("validate.columns.expected")}</th>
                <th className="py-2 font-medium">{t("validate.columns.status")}</th>
              </tr>
            </thead>

            {requirement.scenarios
              .filter((scenario) => scenario.cases.length > 0)
              .map((scenario) => (
                <tbody key={scenario.id}>
                  <tr>
                    <td
                      colSpan={6}
                      className="border-b border-gray-200/80 pb-2 pt-4 text-xs font-semibold uppercase tracking-wider text-brand-strong"
                    >
                      {t("validate.scenarioLabel", { title: scenario.title })}
                    </td>
                  </tr>

                  {scenario.cases.map((testCase) => (
                    <tr
                      key={testCase.id}
                      className="border-b border-gray-200/60 align-top last:border-b-0"
                    >
                      <td className="py-3 pr-2 font-mono text-xs text-gray-500">
                        {testCase.id}
                      </td>
                      <td className="w-32 py-3 pr-2 font-medium text-ink">
                        {testCase.title}
                      </td>
                      <td className="py-3 pr-2 text-xs text-gray-600">
                        {testCase.precondition || "—"}
                      </td>
                      <td className="py-3 pr-2 text-xs text-gray-600">
                        {testCase.steps.length > 0 ? (
                          <ol className="list-decimal space-y-0.5 pl-4">
                            {testCase.steps.map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ol>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 pr-2 text-xs text-gray-600">
                        {testCase.expectedResult || "—"}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          {/* Quick toggle: checked = passed */}
                          <input
                            type="checkbox"
                            aria-label={t("validate.markPassed", { id: testCase.id })}
                            checked={testCase.status === "pass"}
                            onChange={(event) =>
                              setStatus(testCase.id, event.target.checked ? "pass" : "open")
                            }
                            className="h-4 w-4 accent-success"
                          />

                          <select
                            aria-label={t("validate.columns.status")}
                            value={testCase.status}
                            onChange={(event) =>
                              setStatus(testCase.id, event.target.value as TestCaseStatus)
                            }
                            className="rounded-full border border-gray-200 bg-white/80 px-2 py-1 text-xs outline-none focus:border-brand"
                          >
                            {STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {t(`testStatus.${status}`)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
          </table>
        </div>
      </Card>

      <CoverageReport title={t("coverage.reportTitle")} coverage={coverage}>
        <Button size="lg" className="w-full" onClick={downloadReport}>
          {t("validate.downloadReport")}
        </Button>
        <Button variant="secondary" size="lg" className="w-full" onClick={downloadTable}>
          {t("validate.downloadTable")}
        </Button>
      </CoverageReport>
    </div>
  );
}

export default ValidateStep;
