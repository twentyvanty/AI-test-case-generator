import { useTranslation } from "react-i18next";
import type { TestReport } from "../../services/report";
import { formatRequirementCode, formatScenarioCode } from "../../services/requirements";
import CoverageReport, { type CoverageSummary } from "../coverage/CoverageReport";
import Card from "../ui/Card";
import { ReportAi, ReportDefects } from "./ReportDefects";
import ReportRisks, { type ReportLinkStep } from "./ReportRisks";
import ReportTraceability from "./ReportTraceability";
import { formatDay, formatMoment, verdictReasonText } from "./reportLabels";

type ReportViewProps = {
  report: TestReport;
  // Opens Step 2 / Step 3 from a risk; left out for a read-only (finalized) report
  onGoToStep?: (step: ReportLinkStep) => void;
};

// The whole test completion report (D-040), drawn from the report's data: the
// live one, or a finalized version's snapshot (6d-2). Sections modelled on
// ISO/IEC/IEEE 29119-3: header, summary + suggested verdict, risks to confirm,
// results, traceability, defects, AI generation.
function ReportView({ report, onGoToStep }: ReportViewProps) {
  const { t, i18n } = useTranslation();
  const { header, summary } = report;
  const ready = summary.verdict.value === "READY";

  const coverage: CoverageSummary = {
    percent: summary.passRate,
    areas: report.results
      .filter((result) => result.total > 0)
      .map((result) => ({
        key: String(result.scenarioNumber),
        label: `${formatScenarioCode(result.scenarioNumber)} ${result.title}`,
        passed: result.passed,
        total: result.total,
      })),
    passedCases: summary.testCases.passed,
    failingCases: summary.testCases.failed,
    mappedCases: summary.testCases.total,
  };

  const headerRows: [string, string][] = [
    [t("report.header.project"), header.projectName],
    [t("report.header.tester"), header.tester ?? "—"],
    [
      t("report.header.techniques"),
      header.techniques.map((technique) => t(`techniques.${technique}`)).join(", ") || "—",
    ],
    [t("report.header.casesGenerated"), formatDay(header.casesGeneratedAt, i18n.language)],
    [t("report.header.reportDate"), formatMoment(report.reportedAt, i18n.language)],
  ];

  const numbers: [string, string, string?][] = [
    [t("report.numbers.cases"), String(summary.testCases.total)],
    [t("report.numbers.passed"), String(summary.testCases.passed), "text-success"],
    [t("report.numbers.failed"), String(summary.testCases.failed), summary.testCases.failed > 0 ? "text-danger" : undefined],
    [t("report.numbers.notRun"), String(summary.testCases.notRun)],
    [t("report.numbers.passRate"), `${summary.passRate}%`],
    [
      t("report.numbers.defects"),
      t("report.numbers.defectsValue", { open: summary.defects.open, resolved: summary.defects.resolved }),
    ],
  ];

  return (
    <div className="report space-y-4">
      <Card padding="md" className="report-section">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-gray-500">
          {t("report.title")} · {formatRequirementCode(header.requirementNumber)}
        </p>
        <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight text-ink">{header.title}</h2>

        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {headerRows.map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <dt className="w-36 shrink-0 text-gray-500">{label}</dt>
              <dd className="min-w-0 break-words text-ink">{value}</dd>
            </div>
          ))}
        </dl>

        <div
          className={`mt-5 rounded-2xl border px-4 py-4 ${ready ? "border-success/30 bg-success/10" : "border-danger/25 bg-danger/5"}`}
          data-testid="report-verdict"
        >
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">{t("report.verdict.suggested")}</p>
          <p className={`mt-1 font-heading text-2xl font-semibold ${ready ? "text-success" : "text-danger"}`}>
            {t(`report.verdict.${summary.verdict.value}`)}
          </p>
          {ready ? (
            <p className="mt-1 text-sm text-gray-700">{t("report.verdict.readyText")}</p>
          ) : (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-gray-700">
              {summary.verdict.reasons.map((reason) => (
                <li key={reason.code}>{verdictReasonText(reason, t)}</li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-gray-500">{t("report.verdict.rule")}</p>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {numbers.map(([label, value, tone]) => (
            <div key={label} className="rounded-xl bg-track/60 px-3 py-2.5">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className={`mt-0.5 font-heading text-lg font-semibold ${tone ?? "text-ink"}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <ReportRisks risks={report.risks} onGoToStep={onGoToStep} />

      <CoverageReport title={t("report.results.title")} coverage={coverage} className="report-section" limit={6} />

      <ReportTraceability traceability={report.traceability} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportDefects defects={report.defects} total={summary.defects.total} />
        <ReportAi ai={report.ai} />
      </div>
    </div>
  );
}

export default ReportView;
