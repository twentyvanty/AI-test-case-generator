import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getReport, type LiveReport } from "../../services/report";
import type { RequirementDetail, Scenario, TestCase } from "../../services/requirements";
import { downloadReport } from "../../utils/reportExport";
import { downloadCaseTable, downloadCoverageReport, groupByScenario } from "../../utils/testCaseExport";
import ReportConclusion from "../report/ReportConclusion";
import type { ReportLinkStep } from "../report/ReportRisks";
import { formatDay } from "../report/reportLabels";
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
// conclusion and "Finalize report". Versions and printing come in 6d-2b.
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-gray-500">{t("report.description")}</p>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => report && downloadReport(report, t)} disabled={!report}>
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
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {t("report.loadError", { message: error })}
        </p>
      )}

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
    </div>
  );
}

export default ReportStep;
