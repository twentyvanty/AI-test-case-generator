import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getRequirement, type RequirementDetail, type RunningGeneration } from "../../services/requirements";
import Spinner from "../ui/Spinner";

// How often the page asks whether the generation has finished
const CHECK_EVERY_MS = 5000;

type GenerationRunningProps = {
  projectId: number;
  requirementNumber: number;
  generating: RunningGeneration;
  // The requirement once the generation has finished (new scenarios / test cases)
  onFinished: (detail: RequirementDetail) => void;
};

// "Still generating…" (D-039): shown when the page was refreshed or opened while
// an AI generation runs on the server, or after a click that the backend refused
// because one is already running. Checks every few seconds and hands the
// finished requirement back to the page.
function GenerationRunning({ projectId, requirementNumber, generating, onFinished }: GenerationRunningProps) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let stopped = false;

    const timer = window.setInterval(async () => {
      setNow(Date.now());

      try {
        const detail = await getRequirement(projectId, requirementNumber);

        if (!stopped && detail.generating === null) {
          stopped = true;
          window.clearInterval(timer);
          onFinished(detail);
        }
      } catch (error) {
        // A failed check is tried again on the next tick
        console.error("Generation check failed:", error);
      }
    }, CHECK_EVERY_MS);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [projectId, requirementNumber, onFinished]);

  const minutes = Math.max(0, Math.floor((now - new Date(generating.since).getTime()) / 60000));
  const what = generating.kind === "SCENARIOS" ? "scenarios" : "testCases";

  return (
    <div className="rounded-2xl border border-brand/30 bg-brand-soft/50 px-4 py-3" data-testid="generation-running">
      <Spinner
        label={t(`generationRunning.${what}`, {
          started: minutes === 0 ? t("generationRunning.justNow") : t("generationRunning.minutesAgo", { count: minutes }),
        })}
      />
      <p className="mt-1 text-xs text-gray-600">{t("generationRunning.hint")}</p>
    </div>
  );
}

export default GenerationRunning;
