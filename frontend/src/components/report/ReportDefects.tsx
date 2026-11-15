import { useTranslation } from "react-i18next";
import { DEFECT_SEVERITIES, DEFECT_STATUSES } from "../../services/defects";
import type { TestReport } from "../../services/report";
import Card from "../ui/Card";

const headerClasses = "px-2 pb-2 text-left text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-gray-500";

// Defects by severity × status, every cell shown
export function ReportDefects({
  defects,
  total,
}: {
  defects: TestReport["defects"];
  total: number;
}) {
  const { t } = useTranslation();

  return (
    <Card padding="md" className="report-section min-w-0">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">{t("report.defects.title")}</h2>

      {total === 0 ? (
        <p className="mt-4 text-sm text-gray-500">{t("report.defects.none")}</p>
      ) : (
        <>
          <div className="-mx-2 mt-4 overflow-x-auto">
            <table className="w-full min-w-[26rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200/80">
                  <th className={headerClasses}>{t("report.defects.severity")}</th>
                  {DEFECT_STATUSES.map((status) => (
                    <th key={status} className={`${headerClasses} text-right`}>
                      {t(`defects.statuses.${status}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEFECT_SEVERITIES.map((severity) => (
                  <tr key={severity} className="border-b border-gray-200/80 last:border-0">
                    <th scope="row" className="px-2 py-2 text-left font-medium text-gray-700">
                      {t(`defects.severities.${severity}`)}
                    </th>
                    {DEFECT_STATUSES.map((status) => {
                      const count = defects.bySeverity[severity][status];

                      return (
                        <td
                          key={status}
                          className={`px-2 py-2 text-right font-mono ${count === 0 ? "text-gray-300" : "font-semibold text-ink"}`}
                        >
                          {count}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(defects.notLinked > 0 || defects.onDeletedCases > 0) && (
            <p className="mt-3 text-xs text-gray-500">
              {[
                defects.notLinked > 0 && t("report.defects.notLinked", { count: defects.notLinked }),
                defects.onDeletedCases > 0 && t("report.defects.onDeletedCases", { count: defects.onDeletedCases }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </>
      )}
    </Card>
  );
}

// How the AI produced what's on screen
export function ReportAi({ ai }: { ai: TestReport["ai"] }) {
  const { t, i18n } = useTranslation();
  const number = (value: number) => value.toLocaleString(i18n.language);

  const rows: [string, string][] = [
    [t("report.ai.runs"), number(ai.runs)],
    [t("report.ai.attempts"), number(ai.attempts)],
    [t("report.ai.firstTry"), `${number(ai.passedFirstTry)} / ${number(ai.runs)}`],
    [t("report.ai.needsReview"), number(ai.needsReview)],
    [t("report.ai.generator"), ai.generatorModels.join(", ") || "—"],
    [t("report.ai.validator"), ai.validatorModels.join(", ") || "—"],
    [t("report.ai.tokens"), `${number(ai.tokens.input)} / ${number(ai.tokens.output)}`],
  ];

  return (
    <Card padding="md" className="report-section min-w-0">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">{t("report.ai.title")}</h2>
      <dl className="mt-4 space-y-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
            <dt className="text-gray-500">{label}</dt>
            <dd className="break-all text-right font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-gray-500">{t("report.ai.tokensHint")}</p>
    </Card>
  );
}
