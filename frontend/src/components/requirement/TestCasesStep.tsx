import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  deleteTestCase,
  formatScenarioCode,
  formatTestCaseCode,
  hasAiNotes,
  markRunReviewed,
  needsReview,
  TEST_CASE_STATUSES,
  updateTestCase,
  type RequirementDetail,
  type RunSummary,
  type Scenario,
  type TestCase,
  type TestCaseChanges,
  type TestCaseStatus,
} from "../../services/requirements";
import { cn } from "../../utils/cn";
import { countStatus, downloadCaseTable, groupByScenario } from "../../utils/testCaseExport";
import ActionMenu from "../ui/ActionMenu";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Modal from "../ui/Modal";
import ReviewNote from "./ReviewNote";
import TestCaseForm from "./TestCaseForm";

const STATUS_CLASSES: Record<TestCaseStatus, string> = {
  OPEN: "text-ink-soft",
  PASS: "text-success",
  FAIL: "text-danger",
};

const headerClasses =
  "px-2 pb-3 text-left text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-gray-500";

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

type TestCasesStepProps = {
  projectId: number;
  requirementNumber: number;
  scenarios: Scenario[];
  testCases: TestCase[];
  // The runs behind the test cases (one per batch): their review notes / AI notes
  caseRuns: RunSummary[];
  onChange: (changes: Partial<RequirementDetail>) => void;
  onBack: () => void;
  onNext: () => void;
};

// Step 3: the generated test cases, grouped by scenario, with a status (Open /
// Pass / Fail) for each, edit and delete, and the table download. Coverage and
// the report download live in Step 5; the defect report comes under the table
// in Slice 6.
function TestCasesStep({
  projectId,
  requirementNumber,
  scenarios,
  testCases,
  caseRuns,
  onChange,
  onBack,
  onNext,
}: TestCasesStepProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<TestCase | null>(null);
  const [deleting, setDeleting] = useState<TestCase | null>(null);
  const [busy, setBusy] = useState(false);

  // Scenarios added after the test cases were generated (D-029)
  const pending = scenarios.filter((scenario) => scenario.testCaseCount === 0);
  const groups = groupByScenario(scenarios, testCases);
  const passed = countStatus(testCases, "PASS");
  const failed = countStatus(testCases, "FAIL");

  // NEEDS_REVIEW runs first; otherwise the warnings of runs that passed
  const reviewRuns = caseRuns.filter((run) => needsReview(run));
  const noteRuns = reviewRuns.length > 0 ? reviewRuns : caseRuns.filter((run) => hasAiNotes(run));

  const setTestCases = (next: TestCase[], changes: Partial<RequirementDetail> = {}) =>
    onChange({ testCases: next, testCaseCount: next.length, ...changes });

  const replaceTestCase = (updated: TestCase) =>
    setTestCases(testCases.map((item) => (item.id === updated.id ? updated : item)));

  // The screen changes first; if saving fails it goes back and shows the error
  const changeStatus = async (testCase: TestCase, status: TestCaseStatus) => {
    replaceTestCase({ ...testCase, status });
    setError(null);

    try {
      await updateTestCase(projectId, requirementNumber, testCase.number, { status });
    } catch (error) {
      replaceTestCase(testCase);
      setError(errorText(error));
    }
  };

  const act = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);

    try {
      await action();
    } catch (error) {
      console.error("Test case action failed:", error);
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = (testCase: TestCase, changes: TestCaseChanges) =>
    act(async () => {
      replaceTestCase(await updateTestCase(projectId, requirementNumber, testCase.number, changes));
      setEditing(null);
    });

  const remove = (testCase: TestCase) =>
    act(async () => {
      setDeleting(null);
      const { status } = await deleteTestCase(projectId, requirementNumber, testCase.number);
      const remaining = testCases.filter((item) => item.id !== testCase.id);

      setTestCases(remaining, {
        status,
        // Its scenario unlocks when its last test case is gone
        scenarios: scenarios.map((scenario) =>
          scenario.id === testCase.scenarioId
            ? { ...scenario, testCaseCount: Math.max(scenario.testCaseCount - 1, 0) }
            : scenario
        ),
      });

      if (remaining.length === 0) {
        onBack();
      }
    });

  // Marks every run whose notes are shown
  const markReviewed = (runs: RunSummary[]) =>
    act(async () => {
      const marked = await Promise.all(
        runs.map((run) => markRunReviewed(projectId, requirementNumber, run.id))
      );
      const reviewedAt = new Map(marked.map((run) => [run.id, run.reviewedAt]));

      onChange({
        caseRuns: caseRuns.map((run) =>
          reviewedAt.has(run.id) ? { ...run, reviewedAt: reviewedAt.get(run.id) } : run
        ),
      });
    });

  const downloadTable = () =>
    downloadCaseTable(requirementNumber, groups, (status) => t(`testCaseStatus.${status}`));

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-5 py-3 text-sm"
        >
          <p className="flex items-center gap-2 text-ink">
            <span aria-hidden="true" className="text-warning">
              ⚠
            </span>
            {t("testCasesStep.syncBanner", { count: pending.length })}
          </p>
          <Button variant="secondary" size="sm" onClick={onBack}>
            {t("testCasesStep.syncReview")}
          </Button>
        </div>
      )}

      <Card padding="md" className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">
              {t("testCasesStep.title")}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {t("testCasesStep.summary", { count: testCases.length, pass: passed, fail: failed })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={onBack}>
              <span aria-hidden="true">←</span> {t("testCasesStep.backToScenarios")}
            </Button>
            <Button variant="secondary" size="sm" onClick={downloadTable} disabled={testCases.length === 0}>
              {t("testCasesStep.downloadTable")}
            </Button>
            <Button variant="brand" size="sm" onClick={onNext} disabled={testCases.length === 0}>
              {t("testCasesStep.next")} <span aria-hidden="true">→</span>
            </Button>
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-track/70 px-4 py-2 text-sm text-gray-600">
          {t("testCasesStep.exportNote")}
        </p>

        {noteRuns.length > 0 && (
          <div className="mt-4">
            <ReviewNote
              runs={noteRuns}
              kind="testCases"
              variant={reviewRuns.length > 0 ? "review" : "notes"}
              marking={busy}
              onMarkReviewed={() => markReviewed(noteRuns)}
            />
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {testCases.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">{t("testCasesStep.empty")}</p>
        ) : (
          <div className="-mx-2 mt-4 overflow-x-auto">
            <table className="w-full min-w-[48rem] table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200/80">
                  <th className={cn(headerClasses, "w-20")}>{t("testCasesStep.columns.id")}</th>
                  <th className={cn(headerClasses, "w-[17%]")}>{t("testCasesStep.columns.title")}</th>
                  <th className={headerClasses}>{t("testCasesStep.columns.precondition")}</th>
                  <th className={headerClasses}>{t("testCasesStep.columns.steps")}</th>
                  <th className={headerClasses}>{t("testCasesStep.columns.expected")}</th>
                  <th className={cn(headerClasses, "w-36")}>{t("testCasesStep.columns.status")}</th>
                  <th className={cn(headerClasses, "w-9")}>
                    <span className="sr-only">{t("testCasesStep.columns.actions")}</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {groups.map(({ scenario, cases }) => (
                  <Fragment key={scenario.id}>
                    <tr className="border-b border-gray-200/80">
                      <th
                        colSpan={7}
                        scope="colgroup"
                        className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-brand-strong"
                      >
                        {formatScenarioCode(scenario.number)} ·{" "}
                        {t("testCasesStep.scenario", { title: scenario.title })}
                      </th>
                    </tr>

                    {cases.map((item) => {
                      const code = formatTestCaseCode(item.number);

                      return (
                        <tr key={item.id} className="border-b border-gray-200/80 align-top last:border-0">
                          <td className="whitespace-nowrap px-2 py-4 font-mono text-xs leading-5 text-gray-500">{code}</td>
                          <td className="px-2 py-4 font-medium leading-5 text-ink">{item.title}</td>
                          <td className="px-2 py-4 text-xs leading-5 text-gray-600">{item.precondition}</td>
                          <td className="px-2 py-4 text-xs leading-5 text-gray-600">
                            <ol className="list-decimal space-y-0.5 pl-4">
                              {item.steps.map((step, index) => (
                                <li key={index}>{step}</li>
                              ))}
                            </ol>
                          </td>
                          <td className="px-2 py-4 text-xs leading-5 text-gray-600">{item.expectedResult}</td>
                          <td className="px-2 py-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.status === "PASS"}
                                onChange={(event) => changeStatus(item, event.target.checked ? "PASS" : "OPEN")}
                                aria-label={t("testCasesStep.markPassed", { code })}
                                className="h-4 w-4 shrink-0 cursor-pointer accent-success"
                              />
                              <select
                                value={item.status}
                                onChange={(event) => changeStatus(item, event.target.value as TestCaseStatus)}
                                aria-label={t("testCasesStep.statusOf", { code })}
                                className={cn(
                                  "w-full min-w-0 cursor-pointer rounded-full border border-gray-200 bg-white/80 py-1 pl-2.5 pr-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-brand-soft",
                                  STATUS_CLASSES[item.status]
                                )}
                              >
                                {TEST_CASE_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {t(`testCaseStatus.${status}`)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="px-1 py-3">
                            <ActionMenu
                              label={t("testCasesStep.actionsFor", { code })}
                              disabled={busy}
                              items={[
                                { label: t("testCasesStep.edit"), onSelect: () => setEditing(item) },
                                {
                                  label: t("testCasesStep.delete"),
                                  onSelect: () => setDeleting(item),
                                  danger: true,
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={t("testCasesStep.editTitle", { code: editing ? formatTestCaseCode(editing.number) : "" })}
      >
        {editing && (
          <TestCaseForm
            key={editing.id}
            testCase={editing}
            saving={busy}
            onSave={(changes) => saveEdit(editing, changes)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t("testCasesStep.confirmDeleteTitle", {
          code: deleting ? formatTestCaseCode(deleting.number) : "",
        })}
        description={t("testCasesStep.confirmDeleteText")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={() => deleting && remove(deleting)} disabled={busy}>
              {t("testCasesStep.delete")}
            </Button>
          </>
        }
      />
    </div>
  );
}

export default TestCasesStep;
