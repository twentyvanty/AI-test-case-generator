import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { CoverageSummary } from "../../services/requirements";
import Card from "../ui/Card";
import ProgressBar, { type ProgressTone } from "../ui/ProgressBar";

// Green when mostly passing, amber when partly, red when mostly not
function toneFor(passed: number, total: number): ProgressTone {
  const ratio = total > 0 ? passed / total : 0;

  if (ratio >= 0.75) {
    return "success";
  }

  return ratio >= 0.4 ? "warning" : "danger";
}

type CoverageReportProps = {
  title: string;
  coverage: CoverageSummary;
  // Extra content at the bottom, e.g. download buttons
  children?: ReactNode;
  className?: string;
};

function CoverageReport({ title, coverage, children, className }: CoverageReportProps) {
  const { t } = useTranslation();

  return (
    <Card padding="md" className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">
          {title}
        </h2>

        <span className="font-heading text-2xl font-semibold text-brand-strong">
          {coverage.percent}%
        </span>
      </div>

      {coverage.areas.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">{t("coverage.empty")}</p>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {coverage.areas.map((area) => (
            <li key={area.key}>
              <div className="mb-1.5 flex items-baseline justify-between gap-4">
                <span className="truncate text-sm text-gray-600">{area.label}</span>
                <span className="font-mono text-xs text-gray-600">
                  {area.passed}/{area.total}
                </span>
              </div>

              <ProgressBar
                value={area.passed}
                max={area.total}
                tone={toneFor(area.passed, area.total)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-200/80 pt-4">
        <div>
          <p className="font-heading text-2xl font-semibold text-danger">
            {coverage.failingCases}
          </p>
          <p className="text-xs text-gray-500">{t("coverage.failingCases")}</p>
        </div>

        <div>
          <p className="font-heading text-2xl font-semibold text-ink">
            {coverage.mappedCases}
          </p>
          <p className="text-xs text-gray-500">{t("coverage.mappedCases")}</p>
        </div>
      </div>

      {children && <div className="mt-5 flex flex-col gap-2">{children}</div>}
    </Card>
  );
}

export default CoverageReport;
