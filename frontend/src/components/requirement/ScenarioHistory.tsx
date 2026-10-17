import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getScenarioRuns,
  type GenerationStatus,
  type ScenarioRun,
} from "../../services/requirements";
import Badge, { type BadgeTone } from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";

const STATUS_TONE: Record<GenerationStatus, BadgeTone> = {
  PASSED: "success",
  NEEDS_REVIEW: "warning",
  FAILED: "danger",
};

type ScenarioHistoryProps = {
  open: boolean;
  projectId: number;
  requirementNumber: number;
  onClose: () => void;
  onRestore: (run: ScenarioRun) => void;
};

// The last 10 scenario drafts; each successful one can be restored
function ScenarioHistory({
  open,
  projectId,
  requirementNumber,
  onClose,
  onRestore,
}: ScenarioHistoryProps) {
  const { t, i18n } = useTranslation();
  const [runs, setRuns] = useState<ScenarioRun[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    getScenarioRuns(projectId, requirementNumber)
      .then((data) => !cancelled && setRuns(data))
      .catch((error) => !cancelled && setError(String(error.message ?? error)));

    return () => {
      cancelled = true;
    };
  }, [open, projectId, requirementNumber]);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value)
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("scenarioHistory.title")}
      description={t("scenarioHistory.description")}
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t("scenarioHistory.close")}
        </Button>
      }
    >
      {error && <p className="text-sm text-danger">{error}</p>}

      {!runs && !error && <Spinner label={t("common.loading")} />}

      {runs?.length === 0 && <p className="text-sm text-gray-500">{t("scenarioHistory.empty")}</p>}

      {runs && runs.length > 0 && (
        <ul className="max-h-80 divide-y divide-gray-200/80 overflow-y-auto">
          {runs.map((run, index) => (
            <li key={run.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {t(`scenarioHistory.mode.${run.mode}`)}
                  {index === 0 && (
                    <span className="ml-1.5 text-xs font-normal text-gray-500">
                      {t("scenarioHistory.latest")}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{formatDate(run.createdAt)}</span>
                  <Badge tone={STATUS_TONE[run.status]}>{t(`runStatus.${run.status}`)}</Badge>
                  {run.restorable && (
                    <span>{t("scenarioHistory.count", { count: run.scenarioCount })}</span>
                  )}
                </p>
              </div>

              {run.restorable && (
                <Button variant="secondary" size="sm" onClick={() => onRestore(run)}>
                  {t("scenarioHistory.restore")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default ScenarioHistory;
