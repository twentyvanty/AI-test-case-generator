import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  createScenario,
  deleteScenario,
  draftScenarios,
  draftTestCases,
  estimateCaseMinutes,
  formatScenarioCode,
  getRequirement,
  hasAiNotes,
  markRunReviewed,
  needsReview,
  restoreScenarioRun,
  updateScenario,
  type DraftMode,
  type RequirementDetail,
  type RunSummary,
  type Scenario,
  type ScenarioInput,
  type ScenarioRun,
  type TestCase,
} from "../../services/requirements";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import CaseSyncPanel from "./CaseSyncPanel";
import ReviewNote from "./ReviewNote";
import ScenarioCard from "./ScenarioCard";
import ScenarioForm from "./ScenarioForm";
import ScenarioHistory from "./ScenarioHistory";

const NEW_SCENARIO: ScenarioInput = {
  title: "",
  description: "",
  technique: null,
  estimatedCases: 1,
};

type Busy = "more" | "replace" | "saving" | "deleting" | "restoring" | "cases" | "reviewing" | null;

// What the confirm dialog is asking about
type Confirm =
  | { kind: "delete"; scenario: Scenario }
  | { kind: "redraft" }
  | { kind: "restore"; run: ScenarioRun }
  | null;

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

// Roughly how many test cases the AI will write for these scenarios
const estimateFor = (scenarios: Scenario[]) =>
  scenarios.reduce((sum, scenario) => sum + (scenario.estimatedCases || 3), 0);

type ScenariosStepProps = {
  projectId: number;
  requirementNumber: number;
  scenarios: Scenario[];
  testCases: TestCase[];
  latestRun: RunSummary | null;
  // Tells the page what changed, so the header, tabs and other steps stay in sync
  onChange: (changes: Partial<RequirementDetail>) => void;
  onGoToTestCases: () => void;
};

// Step 2: review the drafted scenarios — edit, add, delete, generate more, redraft,
// or restore an earlier draft — then generate their test cases.
// D-029: once a scenario has test cases it's locked (no edit; deleting it takes its
// test cases along), and the list can't be redrafted or restored any more.
function ScenariosStep({
  projectId,
  requirementNumber,
  scenarios,
  testCases,
  latestRun,
  onChange,
  onGoToTestCases,
}: ScenariosStepProps) {
  const { t } = useTranslation();
  // A scenario number, "new" for the add form, or null
  const [editing, setEditing] = useState<number | "new" | null>(null);
  // "Add a scenario for this": the review issue shown above the add form
  const [reminder, setReminder] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const locked = busy !== null;
  const hasTestCases = testCases.length > 0;
  const pending = scenarios.filter((scenario) => scenario.testCaseCount === 0);
  const totalEstimate = estimateFor(scenarios);

  const setScenarios = (next: Scenario[], changes: Partial<RequirementDetail> = {}) =>
    onChange({ scenarios: next, scenarioCount: next.length, ...changes });

  const replaceScenario = (updated: Scenario) =>
    setScenarios(scenarios.map((item) => (item.id === updated.id ? updated : item)));

  const closeForm = () => {
    setEditing(null);
    setReminder(null);
  };

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

  const saveEdit = (scenario: Scenario, input: ScenarioInput) =>
    run("saving", async () => {
      replaceScenario(await updateScenario(projectId, requirementNumber, scenario.number, input));
      closeForm();
    });

  const addScenario = (input: ScenarioInput) =>
    run("saving", async () => {
      const created = await createScenario(projectId, requirementNumber, input);
      setScenarios([...scenarios, created]);
      closeForm();
    });

  const removeScenario = (scenario: Scenario) =>
    run("deleting", async () => {
      const { status, deletedTestCases } = await deleteScenario(
        projectId,
        requirementNumber,
        scenario.number
      );
      const remaining = testCases.filter((testCase) => testCase.scenarioId !== scenario.id);

      setScenarios(
        scenarios.filter((item) => item.id !== scenario.id),
        { status, testCases: remaining, testCaseCount: remaining.length }
      );
      setNotice(
        deletedTestCases > 0
          ? t("scenariosStep.deletedWithCases", {
              code: formatScenarioCode(scenario.number),
              count: deletedTestCases,
            })
          : t("scenariosStep.deleted", { code: formatScenarioCode(scenario.number) })
      );
    });

  const generate = (mode: DraftMode) =>
    run(mode, async () => {
      const result = await draftScenarios(projectId, requirementNumber, mode);

      if (result.run.status === "FAILED") {
        setError(t("requirementPage.aiFailed", { message: result.run.errorMessage }));
        return;
      }

      closeForm();
      setScenarios(result.scenarios, {
        latestScenarioRun: result.run,
        ...(mode === "replace" && { status: "SCENARIOS_READY" }),
      });
    });

  const restore = (scenarioRun: ScenarioRun) =>
    run("restoring", async () => {
      const restored = await restoreScenarioRun(projectId, requirementNumber, scenarioRun.id);
      closeForm();
      // The "needs review" note belonged to the latest draft, not this one
      setScenarios(restored, { status: "SCENARIOS_READY", latestScenarioRun: null });
      setNotice(t("scenariosStep.restored"));
    });

  // Test cases for the scenarios that don't have any yet, then open step 3.
  // The backend works in batches: some can pass while a later one fails, so the
  // page is reloaded whenever any cases were saved.
  const generateCases = () =>
    run("cases", async () => {
      const result = await draftTestCases(projectId, requirementNumber);
      const passed = result.runs.filter((batch) => batch.status !== "FAILED");

      if (passed.length > 0) {
        closeForm();
        // Reload so every scenario's lock and the runs behind the cases are up to date
        onChange(await getRequirement(projectId, requirementNumber));
      }

      if (result.run.status !== "FAILED") {
        onGoToTestCases();
        return;
      }

      const codes = (batches: typeof result.runs) =>
        batches
          .flatMap((batch) => batch.input?.scenarioNumbers ?? [])
          .map(formatScenarioCode)
          .join(", ");

      setError(
        passed.length > 0
          ? t("scenariosStep.casesPartial", {
              done: codes(passed),
              message: result.run.errorMessage,
            })
          : t("requirementPage.aiFailed", { message: result.run.errorMessage })
      );
    });

  const markReviewed = (reviewRun: RunSummary) =>
    run("reviewing", async () => {
      const { reviewedAt } = await markRunReviewed(projectId, requirementNumber, reviewRun.id);
      onChange({ latestScenarioRun: { ...reviewRun, reviewedAt } });
    });

  const addForIssue = (issue: string) => {
    setReminder(issue);
    setEditing("new");
  };

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
          : busy === "cases"
            ? t("scenariosStep.generatingCases", {
                // count picks the singular / plural text (scenario / scenarios)
                count: pending.length,
                minutes: estimateCaseMinutes(pending.map((scenario) => scenario.estimatedCases)).minutes,
              })
            : null;

  const deleteText = (scenario: Scenario) =>
    scenario.testCaseCount > 0
      ? t("scenariosStep.confirmDeleteWithCases", { count: scenario.testCaseCount })
      : t("scenariosStep.confirmDeleteText");

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
            disabled={locked || hasTestCases}
            title={hasTestCases ? t("scenariosStep.redraftLocked") : undefined}
          >
            {t("scenariosStep.redraft")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setHistoryOpen(true)} disabled={locked}>
            {t("scenariosStep.history")}
          </Button>

          {pending.length > 0 && !hasTestCases ? (
            <Button variant="brand" size="sm" onClick={generateCases} disabled={locked}>
              {t("scenariosStep.generateCases", { count: estimateFor(pending) })}{" "}
              <span aria-hidden="true">→</span>
            </Button>
          ) : hasTestCases ? (
            <Button variant="brand" size="sm" onClick={onGoToTestCases} disabled={locked}>
              {t("scenariosStep.viewCases")} <span aria-hidden="true">→</span>
            </Button>
          ) : null}
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-track/70 px-4 py-2 text-sm text-gray-600">
        {t("scenariosStep.scenarioCount", { count: scenarios.length })}
        {" · "}
        {hasTestCases
          ? t("scenariosStep.generatedCount", { count: testCases.length })
          : t("scenariosStep.caseCount", { count: totalEstimate })}
        {hasTestCases && <span className="text-gray-500"> · {t("scenariosStep.lockedNote")}</span>}
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

      {hasTestCases && pending.length > 0 && (
        <div className="mt-4">
          <CaseSyncPanel pending={pending} disabled={locked} onGenerate={generateCases} />
        </div>
      )}

      {(needsReview(latestRun) || hasAiNotes(latestRun)) && latestRun && (
        <div className="mt-4">
          <ReviewNote
            run={latestRun}
            kind="scenarios"
            variant={needsReview(latestRun) ? "review" : "notes"}
            marking={busy === "reviewing"}
            onMarkReviewed={() => markReviewed(latestRun)}
            onAddForIssue={locked ? undefined : addForIssue}
          />
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
            onCancelEdit={closeForm}
            onSave={(input) => saveEdit(scenario, input)}
            onDelete={() => setConfirm({ kind: "delete", scenario })}
          />
        ))}

        {editing === "new" && (
          <div className="rounded-2xl border border-brand/40 bg-white/80 p-4">
            <p className="mb-3 text-sm font-medium text-ink">{t("scenariosStep.newScenario")}</p>

            {reminder && (
              <p className="mb-3 rounded-xl bg-warning/10 px-3 py-2 text-xs text-gray-700">
                <span className="font-medium">{t("review.reminder")}</span> {reminder}
              </p>
            )}

            <ScenarioForm
              initial={NEW_SCENARIO}
              saving={busy === "saving"}
              onSave={addScenario}
              onCancel={closeForm}
            />
          </div>
        )}
      </div>

      <ScenarioHistory
        open={historyOpen}
        projectId={projectId}
        requirementNumber={requirementNumber}
        canRestore={!hasTestCases}
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
            ? deleteText(confirm.scenario)
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
