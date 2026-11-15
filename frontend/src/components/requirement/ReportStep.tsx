import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getReport,
  getReportVersion,
  type LiveReport,
  type ReportVersion,
  type ReportVersionSummary,
} from "../../services/report";
import type { RequirementDetail, Scenario, TestCase } from "../../services/requirements";
import { downloadReport } from "../../utils/reportExport";
import { downloadCaseTable, downloadCoverageReport, groupByScenario } from "../../utils/testCaseExport";
import ConclusionCard from "../report/ConclusionText";
import ReportConclusion from "../report/ReportConclusion";
import type { ReportLinkStep } from "../report/ReportRisks";
import { formatDay, formatMoment } from "../report/reportLabels";
import ReportView from "../report/ReportView";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";

type ReportStepProps = {
  projectId: number;
  requirementNumber: number;
  requirementTitle: string;
  // For the existing CSV downloads (test case table, coverage)
  scenarios: Scenario[];
  testCases: TestCase[];
  onGoToStep: (step: ReportLinkStep) => void;
  // Tells the page what changed (the status after finalizing)
  onChange: (changes: Partial<RequirementDetail>) => void;
  // After a 409: true when a running generation is the reason
  onConflict?: () => Promise<boolean>;
};

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

// Step 5: the test completion report (Slice 6, D-040), built by the backend from
// the current data each time the step opens, with the CSV downloads, the tester's
// conclusion and "Finalize report". Once the report has been finalized, a picker
// opens any finalized version (its saved snapshot, read-only); "Print / Save as
// PDF" prints whatever is open.
function ReportStep({
  projectId,
  requirementNumber,
  requirementTitle,
  scenarios,
  testCases,
  onGoToStep,
  onChange,
  onConflict,
}: ReportStepProps) {
  const { t, i18n } = useTranslation();
  const [report, setReport] = useState<LiveReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const groups = groupByScenario(scenarios, testCases);

  useEffect(() => {
    let cancelled = false;

    getReport(projectId, requirementNumber)
      .then((data) => !cancelled && setReport(data))
      .catch((failure) => {
        console.error("Failed to load the report:", failure);

        if (!cancelled) {
          setError(errorText(failure));
        }
      });

    return () => {
      cancelled = true;
    };
    // testCases: the step reloads when the page's data changes (e.g. after a refresh)
  }, [projectId, requirementNumber, testCases]);

  // A finalized version is open (null = the live report)
  const [viewing, setViewing] = useState<number | null>(null);
  const [version, setVersion] = useState<ReportVersion | null>(null);
  const [versionError, setVersionError] = useState<string | null>(null);

  const openVersion = (number: number | null) => {
    setViewing(number);
    setVersion(null);
    setVersionError(null);

    if (number === null) {
      return;
    }

    getReportVersion(projectId, requirementNumber, number)
      .then((data) => setVersion(data))
      .catch((failure) => {
        console.error("Failed to load the report version:", failure);
        setVersionError(errorText(failure));
      });
  };

  const live = viewing === null;
  const versions = report?.versions ?? [];
  const versionLabel = (item: ReportVersionSummary) =>
    t("report.view.version", {
      version: item.version,
      date: formatDay(item.finalizedAt, i18n.language),
      verdict: t(`report.verdict.${item.verdict}`),
    });

  return (
    <div className="space-y-4">
      {/* Only on paper: which report this is, and when it was printed */}
      <p className="hidden text-xs text-gray-600 print:block" data-testid="print-header">
        {live
          ? t("report.print.live")
          : version && t("report.print.version", { version: version.version, date: formatDay(version.finalizedAt, i18n.language) })}
        {" · "}
        {t("report.print.printed", { date: formatMoment(new Date().toISOString(), i18n.language) })}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        {versions.length > 0 ? (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            {t("report.view.label")}
            <select
              value={viewing ?? ""}
              onChange={(event) => openVersion(event.target.value === "" ? null : Number(event.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
            >
              <option value="">{t("report.view.live")}</option>
              {versions.map((item) => (
                <option key={item.version} value={item.version}>
                  {versionLabel(item)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-sm text-gray-500">{t("report.description")}</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => window.print()} disabled={live ? !report : !version}>
            {t("report.print.button")}
          </Button>
          {live && (
            <>
              <Button variant="secondary" size="sm" onClick={() => report && downloadReport(report, t)} disabled={!report}>
                {t("report.download.report")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadCoverageReport(requirementNumber, requirementTitle, groups)}
                disabled={testCases.length === 0}
              >
                {t("report.download.coverage")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadCaseTable(requirementNumber, groups, (status) => t(`testCaseStatus.${status}`))}
                disabled={testCases.length === 0}
              >
                {t("report.download.table")}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {t("report.loadError", { message: error })}
        </p>
      )}

      {live ? (
        <>
          {!report && !error && <Spinner label={t("report.loading")} />}

          {report?.finalized && report.changedSinceFinalized && (
            <p
              role="status"
              data-testid="report-changed"
              className="rounded-2xl border border-brand/30 bg-brand-soft/50 px-4 py-3 text-sm text-gray-700 print:hidden"
            >
              {t("report.changed", {
                version: report.finalized.version,
                date: formatDay(report.finalized.finalizedAt, i18n.language),
              })}
            </p>
          )}

          {report && <ReportView report={report} onGoToStep={onGoToStep} />}

          {report && (
            <ReportConclusion
              projectId={projectId}
              requirementNumber={requirementNumber}
              report={report}
              onReport={setReport}
              onFinalized={() => onChange({ status: "REPORTED" })}
              onConflict={onConflict}
            />
          )}
        </>
      ) : (
        <>
          {/* A finalized version: its saved snapshot, read-only */}
          <div
            data-testid="version-banner"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-700 print:hidden"
          >
            <span>
              {version
                ? t("report.view.banner", {
                    version: version.version,
                    date: formatDay(version.finalizedAt, i18n.language),
                    verdict: t(`report.verdict.${version.verdict}`),
                  })
                : t("report.view.loading")}
            </span>
            <Button variant="secondary" size="sm" onClick={() => openVersion(null)}>
              {t("report.view.backToLive")}
            </Button>
          </div>

          {versionError && (
            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
              {t("report.view.loadError", { message: versionError })}
            </p>
          )}

          {!version && !versionError && <Spinner label={t("report.view.loading")} />}

          {version && (
            <>
              <ReportView report={version.snapshot} />
              <ConclusionCard text={version.conclusion} />
            </>
          )}
        </>
      )}
    </div>
  );
}

export default ReportStep;
