import type { BadgeTone } from "../ui/Badge";
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

// At most `limit` codes, then "+3 more"
export function listCodes(codes: string[], more: (count: number) => string, limit = 8) {
  return codes.length > limit ? `${codes.slice(0, limit).join(", ")} ${more(codes.length - limit)}` : codes.join(", ");
}
