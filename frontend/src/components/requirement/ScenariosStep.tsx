import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  createScenario,
  deleteScenario,
  draftScenarios,
  formatScenarioCode,
  issuesOf,
  restoreScenarioRun,
  updateScenario,
  type DraftMode,
  type RequirementDetail,
  type RunSummary,
  type Scenario,
  type ScenarioInput,
  type ScenarioPriority,
  type ScenarioRun,
} from "../../services/requirements";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import ScenarioCard from "./ScenarioCard";
import ScenarioForm from "./ScenarioForm";
import ScenarioHistory from "./ScenarioHistory";

const NEW_SCENARIO: ScenarioInput = {
  title: "",
  description: "",
  technique: null,
  priority: "MEDIUM",
  estimatedCases: 1,
};

type Busy = "more" | "replace" | "saving" | "deleting" | "restoring" | null;

// What the confirm dialog is asking about
type Confirm =
  | { kind: "delete"; scenario: Scenario }
  | { kind: "redraft" }
  | { kind: "restore"; run: ScenarioRun }
  | null;

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

type ScenariosStepProps = {
  projectId: number;
  requirementNumber: number;
  scenarios: Scenario[];
  latestRun: RunSummary | null;
  // Tells the page what changed, so the header, tabs and step 1 stay in sync
  onChange: (changes: Partial<RequirementDetail>) => void;
};

// Step 2: review the drafted scenarios — edit, add, delete, change priority,
// generate more, redraft, or restore an earlier draft
function ScenariosStep({
  projectId,
  requirementNumber,
  scenarios,
  latestRun,
  onChange,
}: ScenariosStepProps) {
  const { t } = useTranslation();
  // A scenario number, "new" for the add form, or null
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const locked = busy !== null;
  const caseCount = scenarios.reduce((sum, scenario) => sum + scenario.estimatedCases, 0);
  const needsReview = latestRun?.status === "NEEDS_REVIEW";
  const reviewIssues = needsReview ? issuesOf(latestRun?.validation?.final) : [];

  const setScenarios = (next: Scenario[], changes: Partial<RequirementDetail> = {}) =>
    onChange({ scenarios: next, scenarioCount: next.length, ...changes });

  const replaceScenario = (updated: Scenario) =>
    setScenarios(scenarios.map((item) => (item.id === updated.id ? updated : item)));

  // Runs one action with the busy state + error message handled
  const run = async (kind: Exclude<Busy, null>, action: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    setNotice(null);

    try {
      await action();
    } catch (error) {
      console.error(`Failed (${kind}):`, error);
      setError(errorText(error));
    } finally {
      setBusy(null);
    }
  };

  // The screen changes first; if saving fails it goes back and shows the error
  const changePriority = async (scenario: Scenario, priority: ScenarioPriority) => {
    replaceScenario({ ...scenario, priority });

    try {
      await updateScenario(projectId, requirementNumber, scenario.number, { priority });
    } catch (error) {
      replaceScenario(scenario);
      setError(errorText(error));
    }
  };

  const saveEdit = (scenario: Scenario, input: ScenarioInput) =>
    run("saving", async () => {
      replaceScenario(await updateScenario(projectId, requirementNumber, scenario.number, input));
      setEditing(null);
    });

  const addScenario = (input: ScenarioInput) =>
    run("saving", async () => {
      const created = await createScenario(projectId, requirementNumber, input);
      setScenarios([...scenarios, created], { status: "SCENARIOS_READY" });
      setEditing(null);
    });

  const removeScenario = (scenario: Scenario) =>
    run("deleting", async () => {
      const { status } = await deleteScenario(projectId, requirementNumber, scenario.number);
      setScenarios(
        scenarios.filter((item) => item.id !== scenario.id),
        { status }
      );
      setNotice(t("scenariosStep.deleted", { code: formatScenarioCode(scenario.number) }));
    });

  const generate = (mode: DraftMode) =>
    run(mode, async () => {
      const result = await draftScenarios(projectId, requirementNumber, mode);

      if (result.run.status === "FAILED") {
        onChange({ latestScenarioRun: result.run });
        setError(t("requirementPage.aiFailed", { message: result.run.errorMessage }));
        return;
      }

      setEditing(null);
      setScenarios(result.scenarios, { status: "SCENARIOS_READY", latestScenarioRun: result.run });
    });

  const restore = (scenarioRun: ScenarioRun) =>
    run("restoring", async () => {
      const restored = await restoreScenarioRun(projectId, requirementNumber, scenarioRun.id);
      setEditing(null);
      // The "needs review" note belonged to the latest draft, not this one
      setScenarios(restored, { status: "SCENARIOS_READY", latestScenarioRun: null });
      setNotice(t("scenariosStep.restored"));
    });

  const confirmAction = () => {
    const current = confirm;
    setConfirm(null);

    if (current?.kind === "delete") {
      removeScenario(current.scenario);
    } else if (current?.kind === "redraft") {
      generate("replace");
    } else if (current?.kind === "restore") {
      restore(current.run);
    }
  };

  const busyMessage =
    busy === "more"
      ? t("scenariosStep.generatingMore")
      : busy === "replace"
        ? t("requirementStep.drafting")
        : busy === "restoring"
          ? t("scenariosStep.restoring")
          : null;

  return (
    <Card padding="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">
            {t("scenariosStep.title")}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{t("scenariosStep.description")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing("new")} disabled={locked}>
            + {t("scenariosStep.add")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => generate("more")} disabled={locked}>
            {t("scenariosStep.generateMore")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setConfirm({ kind: "redraft" })}
            disabled={locked}
          >
            {t("scenariosStep.redraft")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setHistoryOpen(true)} disabled={locked}>
            {t("scenariosStep.history")}
          </Button>
          <Button
            variant="brand"
            size="sm"
            disabled
            title={t("scenariosStep.generateCasesSoon")}
          >
            {t("scenariosStep.generateCases", { count: caseCount })}{" "}
            <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-track/70 px-4 py-2 text-sm text-gray-600">
        {t("scenariosStep.scenarioCount", { count: scenarios.length })}
        {" · "}
        {t("scenariosStep.caseCount", { count: caseCount })}
        <span className="text-gray-400"> · {t("scenariosStep.generateCasesSoon")}</span>
      </p>

      {busyMessage && <Spinner className="mt-4" label={busyMessage} />}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {notice && (
        <p className="mt-4 rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
          {notice}{" "}
          <Link to="/history" className="font-medium underline">
            {t("scenariosStep.openHistory")}
          </Link>
        </p>
      )}

      {needsReview && (
        <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 px-5 py-4 text-sm">
          <p className="font-medium text-ink">{t("scenariosStep.needsReviewTitle")}</p>
          <p className="mt-1 text-gray-600">{t("scenariosStep.needsReviewText")}</p>

          {reviewIssues.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600">
              {reviewIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            editing={editing === scenario.number}
            saving={busy === "saving"}
            disabled={locked || editing !== null}
            onEdit={() => setEditing(scenario.number)}
            onCancelEdit={() => setEditing(null)}
            onSave={(input) => saveEdit(scenario, input)}
            onPriorityChange={(priority) => changePriority(scenario, priority)}
            onDelete={() => setConfirm({ kind: "delete", scenario })}
          />
        ))}

        {editing === "new" && (
          <div className="rounded-2xl border border-brand/40 bg-white/80 p-4">
            <p className="mb-3 text-sm font-medium text-ink">{t("scenariosStep.newScenario")}</p>
            <ScenarioForm
              initial={NEW_SCENARIO}
              saving={busy === "saving"}
              onSave={addScenario}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}
      </div>

      <ScenarioHistory
        open={historyOpen}
        projectId={projectId}
        requirementNumber={requirementNumber}
        onClose={() => setHistoryOpen(false)}
        onRestore={(scenarioRun) => {
          setHistoryOpen(false);
          setConfirm({ kind: "restore", run: scenarioRun });
        }}
      />

      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={
          confirm?.kind === "delete"
            ? t("scenariosStep.confirmDeleteTitle", {
                code: formatScenarioCode(confirm.scenario.number),
              })
            : confirm?.kind === "redraft"
              ? t("scenariosStep.confirmRedraftTitle")
              : t("scenariosStep.confirmRestoreTitle")
        }
        description={
          confirm?.kind === "delete"
            ? t("scenariosStep.confirmDeleteText")
            : t("scenariosStep.confirmReplaceText")
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant={confirm?.kind === "delete" ? "danger" : "primary"} onClick={confirmAction}>
              {confirm?.kind === "delete"
                ? t("scenariosStep.delete")
                : confirm?.kind === "redraft"
                  ? t("scenariosStep.redraft")
                  : t("scenarioHistory.restore")}
            </Button>
          </>
        }
      />
    </Card>
  );
}

export default ScenariosStep;
