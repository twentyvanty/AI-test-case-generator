import { useTranslation } from "react-i18next";
import type { ReportRisk } from "../../services/report";
import { formatScenarioCode, formatTestCaseCode } from "../../services/requirements";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { listCodes } from "./reportLabels";

export type ReportLinkStep = "scenarios" | "testCases";

type ReportRisksProps = {
  risks: ReportRisk[];
  // Opens the step where a risk is fixed; left out where the report is read-only
  onGoToStep?: (step: ReportLinkStep) => void;
};

// Where each risk is fixed
const STEP_FOR: Record<ReportRisk["code"], ReportLinkStep> = {
  FAILED_WITHOUT_DEFECT: "testCases",
  NOT_RUN: "testCases",
  ASSUMED_RULE: "testCases",
  SCENARIOS_WITHOUT_CASES: "scenarios",
  UNREVIEWED_AI_NOTES: "scenarios",
};

// "Risks to confirm" (D-040): what the tester should look at before trusting the result
function ReportRisks({ risks, onGoToStep }: ReportRisksProps) {
  const { t } = useTranslation();
  const more = (count: number) => t("report.risks.more", { count });

  const details = (risk: ReportRisk) => {
    if (risk.code === "UNREVIEWED_AI_NOTES") {
      return risk.items
        .map((run) =>
          run.kind === "SCENARIOS"
            ? t("report.risks.scenarioRun")
            : t("report.risks.caseRun", { codes: run.scenarioNumbers.map(formatScenarioCode).join(", ") })
        )
        .join(" · ");
    }

    const format = risk.code === "SCENARIOS_WITHOUT_CASES" ? formatScenarioCode : formatTestCaseCode;

    return listCodes(risk.items.map(format), more);
  };

  return (
    <Card padding="md" className="report-section">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">{t("report.risks.title")}</h2>
      <p className="mt-0.5 text-sm text-gray-500">{t("report.risks.description")}</p>

      {risks.length === 0 ? (
        <p className="mt-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{t("report.risks.none")}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {risks.map((risk) => (
            <li
              key={risk.code}
              className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">
                  {t(`report.risks.${risk.code}`, { count: risk.items.length })}
                  {risk.code === "SCENARIOS_WITHOUT_CASES" && risk.outOfDate && (
                    <span className="font-normal text-gray-600"> {t("report.risks.outOfDate")}</span>
                  )}
                </p>
                <p className="mt-0.5 break-words font-mono text-xs leading-5 text-gray-600">{details(risk)}</p>
              </div>

              {onGoToStep && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="print:hidden"
                  onClick={() => onGoToStep(STEP_FOR[risk.code])}
                >
                  {STEP_FOR[risk.code] === "testCases" ? t("report.risks.goToCases") : t("report.risks.goToScenarios")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default ReportRisks;
