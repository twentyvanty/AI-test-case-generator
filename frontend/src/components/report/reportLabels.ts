import type { TFunction } from "i18next";
import type { BadgeTone } from "../ui/Badge";
import type { VerdictReason } from "../../services/report";
import { formatDefectCode } from "../../services/requirements";
import type { DefectSeverity, DefectStatus } from "../../services/defects";
import type { TestCaseStatus } from "../../services/requirements";

// Badge colours in the report, the same as Step 3's table and the defect report
export const CASE_TONES: Record<TestCaseStatus, BadgeTone> = { PASS: "success", FAIL: "danger", OPEN: "neutral" };
export const SEVERITY_TONES: Record<DefectSeverity, BadgeTone> = {
  CRITICAL: "danger",
  MAJOR: "warning",
  MINOR: "neutral",
  TRIVIAL: "neutral",
};
export const DEFECT_STATUS_TONES: Record<DefectStatus, BadgeTone> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  FIXED: "success",
  CLOSED: "neutral",
};

// "14 Nov 2026" / "14 พ.ย. 2569"
export const formatDay = (value: string | null, language: string) =>
  value ? new Date(value).toLocaleDateString(language, { day: "numeric", month: "short", year: "numeric" }) : "—";

// "14 Nov 2026, 10:32"
export const formatMoment = (value: string, language: string) =>
  new Date(value).toLocaleString(language, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// One reason for "Not ready", in the interface language. Used by the report and
// by the Finalize dialog, so both say exactly the same.
export const verdictReasonText = (reason: VerdictReason, t: TFunction) =>
  reason.code === "OPEN_SERIOUS_DEFECTS"
    ? t("report.reasons.OPEN_SERIOUS_DEFECTS", {
        defects: reason.defects
          .map((defect) => `${formatDefectCode(defect.number)} (${t(`defects.severities.${defect.severity}`)})`)
          .join(", "),
      })
    : t(`report.reasons.${reason.code}`, { count: "count" in reason ? reason.count : 0 });
