import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  groupIssues,
  type IssueGroup,
  type RunSummary,
} from "../../services/requirements";
import Button from "../ui/Button";

const GROUPS: IssueGroup[] = ["coverage", "technique", "other"];

// The issues of several runs, grouped, without repeats
function mergeGroups(runs: RunSummary[]) {
  const merged: Record<IssueGroup, string[]> = { coverage: [], technique: [], other: [] };

  for (const run of runs) {
    const groups = groupIssues(run.validation?.final);

    for (const group of GROUPS) {
      merged[group] = [...new Set([...merged[group], ...groups[group]])];
    }
  }

  return merged;
}

type ReviewNoteProps = {
  // Usually one run; test cases come from one run per batch, shown together
  runs: RunSummary[];
  // What the run produced: changes the title and the hints
  kind: "scenarios" | "testCases";
  // "review": NEEDS_REVIEW, open and highlighted. "notes": a PASSED run's warnings,
  // collapsed as "AI notes to check (N)" so they're seen but don't shout
  variant?: "review" | "notes";
  marking: boolean;
  onMarkReviewed: () => void;
  // Scenarios only: open the add form with this issue as a reminder
  onAddForIssue?: (issue: string) => void;
};

// The AI's own checks flagged problems: after 3 attempts (NEEDS_REVIEW), or as
// warnings on a run that passed. The issues are grouped by the check that raised
// them, and the tester decides what to do (fix it, add a scenario, or mark it
// as reviewed).
function ReviewNote({
  runs,
  kind,
  variant = "review",
  marking,
  onMarkReviewed,
  onAddForIssue,
}: ReviewNoteProps) {
  const { t } = useTranslation();
  const groups = mergeGroups(runs);
  const attempts = Math.max(...runs.map((run) => run.attempts));
  const count = GROUPS.reduce((sum, group) => sum + groups[group].length, 0);

  const body: ReactNode = (
    <>
      {GROUPS.filter((group) => groups[group].length > 0).map((group) => (
        <div key={group} className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
            {t(`review.group.${kind}.${group}`)}
          </p>

          <ul className="mt-1.5 space-y-1.5">
            {groups[group].map((issue) => (
              <li key={issue} className="flex flex-wrap items-start justify-between gap-2 text-gray-700">
                <span className="min-w-0 flex-1">• {issue}</span>

                {group === "coverage" && onAddForIssue && (
                  <Button variant="secondary" size="sm" onClick={() => onAddForIssue(issue)}>
                    + {t("review.addForIssue")}
                  </Button>
                )}
              </li>
            ))}
          </ul>

          {(group !== "coverage" || !onAddForIssue) && (
            <p className="mt-1 text-xs text-gray-500">{t(`review.hint.${kind}.${group}`)}</p>
          )}
        </div>
      ))}

      <div className="mt-4 flex justify-end">
        <Button variant="secondary" size="sm" onClick={onMarkReviewed} disabled={marking}>
          {t("review.markReviewed")}
        </Button>
      </div>
    </>
  );

  if (variant === "notes") {
    return (
      <details className="rounded-2xl border border-gray-200 bg-white/70 px-5 py-3 text-sm">
        <summary className="cursor-pointer font-medium text-ink">
          {t("review.notesTitle", { count })}
        </summary>
        <p className="mt-2 text-gray-600">{t(`review.notesText.${kind}`)}</p>
        {body}
      </details>
    );
  }

  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/10 px-5 py-4 text-sm">
      <p className="font-medium text-ink">{t(`review.title.${kind}`)}</p>
      <p className="mt-1 text-gray-600">{t("review.text", { count: attempts })}</p>
      {body}
    </div>
  );
}

export default ReviewNote;
