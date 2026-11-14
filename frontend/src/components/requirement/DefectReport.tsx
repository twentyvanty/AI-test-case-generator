import { forwardRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createDefect,
  deleteDefect,
  formatDefectCode,
  formatDefectDate,
  isOpenDefect,
  updateDefect,
  type Defect,
  type DefectInput,
  type DefectPriority,
  type DefectSeverity,
  type DefectStatus,
} from "../../services/defects";
import { formatTestCaseCode, type TestCase } from "../../services/requirements";
import { cn } from "../../utils/cn";
import { downloadDefects } from "../../utils/defectExport";
import Badge, { type BadgeTone } from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import DefectForm from "./DefectForm";

// Badge colours from the mock-up
const SEVERITY_TONES: Record<DefectSeverity, BadgeTone> = {
  CRITICAL: "danger",
  MAJOR: "warning",
  MINOR: "neutral",
  TRIVIAL: "neutral",
};
const PRIORITY_TONES: Record<DefectPriority, BadgeTone> = { HIGH: "danger", MEDIUM: "warning", LOW: "neutral" };
const STATUS_TONES: Record<DefectStatus, BadgeTone> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  FIXED: "success",
  CLOSED: "neutral",
};

const headerClasses =
  "px-2 pb-3 text-left text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-gray-500";

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

// "new" = the add form; a number = that defect is being edited
export type DefectFormState = { kind: "new"; testCaseNumber: number | null } | { kind: "edit"; number: number } | null;

type DefectReportProps = {
  projectId: number;
  requirementNumber: number;
  testCases: TestCase[];
  // null = still loading
  defects: Defect[] | null;
  loadError: string | null;
  onDefectsChange: (defects: Defect[]) => void;
  form: DefectFormState;
  onFormChange: (form: DefectFormState) => void;
};

// The defect report under the Step 3 table (Slice 6): log, edit and delete the
// bugs found while running the test cases, and download them as CSV.
const DefectReport = forwardRef<HTMLDivElement, DefectReportProps>(function DefectReport(
  { projectId, requirementNumber, testCases, defects, loadError, onDefectsChange, form, onFormChange },
  ref
) {
  const { t, i18n } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Defect | null>(null);

  const list = defects ?? [];
  const open = list.filter(isOpenDefect).length;
  // The next number (deleted defects count too, so the server may skip one)
  const nextCode = formatDefectCode(Math.max(0, ...list.map((defect) => defect.number)) + 1);

  const act = async (action: () => Promise<void>) => {
    setSaving(true);
    setError(null);

    try {
      await action();
    } catch (error) {
      console.error("Defect action failed:", error);
      setError(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  const save = (input: DefectInput) =>
    act(async () => {
      if (form?.kind === "edit") {
        const updated = await updateDefect(projectId, requirementNumber, form.number, input);
        onDefectsChange(list.map((defect) => (defect.id === updated.id ? updated : defect)));
      } else {
        const created = await createDefect(projectId, requirementNumber, input);
        onDefectsChange([...list, created]);
      }

      onFormChange(null);
    });

  const remove = (defect: Defect) =>
    act(async () => {
      setDeleting(null);
      await deleteDefect(projectId, requirementNumber, defect.number);
      onDefectsChange(list.filter((item) => item.id !== defect.id));
    });

  const label = (kind: "severities" | "priorities" | "statuses", value: string) => t(`defects.${kind}.${value}`);

  const testCaseCell = (defect: Defect) =>
    defect.testCaseNumber === null ? (
      "—"
    ) : (
      <>
        {formatTestCaseCode(defect.testCaseNumber)}
        {defect.testCaseDeleted && (
          <span className="block font-sans text-[0.6875rem] text-gray-400">{t("defects.deletedLabel")}</span>
        )}
      </>
    );

  return (
    <div ref={ref} className="scroll-mt-24">
      <Card padding="md" className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">{t("defects.title")}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{t("defects.description")}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadDefects(requirementNumber, list, label)}
              disabled={list.length === 0}
            >
              {t("defects.download")}
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={() => onFormChange({ kind: "new", testCaseNumber: null })}
              disabled={form !== null || defects === null}
            >
              + {t("defects.add")}
            </Button>
          </div>
        </div>

        {list.length > 0 && (
          <p className="mt-4 rounded-xl bg-track/70 px-4 py-2 text-sm text-gray-600">
            {t("defects.summary", { count: list.length, open })}
          </p>
        )}

        {(error || loadError) && (
          <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {error ?? loadError}
          </p>
        )}

        {defects === null && !loadError && (
          <div className="mt-4">
            <Spinner label={t("common.loading")} />
          </div>
        )}

        {form?.kind === "new" && (
          <DefectForm
            defect={null}
            code={nextCode}
            testCases={testCases}
            initialTestCaseNumber={form.testCaseNumber}
            saving={saving}
            onSave={save}
            onCancel={() => onFormChange(null)}
          />
        )}

        {defects !== null && list.length === 0 && form?.kind !== "new" && (
          <p className="mt-4 text-sm text-gray-500">{t("defects.empty")}</p>
        )}

        {list.length > 0 && (
          <div className="-mx-2 mt-4 overflow-x-auto">
            <table className="w-full min-w-[50rem] table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200/80">
                  <th className={cn(headerClasses, "w-[4.5rem]")}>{t("defects.columns.id")}</th>
                  <th className={headerClasses}>{t("defects.columns.defect")}</th>
                  <th className={cn(headerClasses, "w-28")}>{t("defects.columns.testCase")}</th>
                  <th className={cn(headerClasses, "w-[5.5rem]")}>{t("defects.columns.severity")}</th>
                  <th className={cn(headerClasses, "w-[5.5rem]")}>{t("defects.columns.priority")}</th>
                  <th className={cn(headerClasses, "w-28")}>{t("defects.columns.status")}</th>
                  <th className={cn(headerClasses, "w-28")}>{t("defects.columns.dates")}</th>
                  <th className={cn(headerClasses, "w-32")}>
                    <span className="sr-only">{t("defects.columns.actions")}</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {list.map((defect) => {
                  const code = formatDefectCode(defect.number);

                  if (form?.kind === "edit" && form.number === defect.number) {
                    return (
                      <tr key={defect.id}>
                        <td colSpan={8} className="px-2">
                          <DefectForm
                            defect={defect}
                            code={code}
                            testCases={testCases}
                            saving={saving}
                            onSave={save}
                            onCancel={() => onFormChange(null)}
                          />
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={defect.id} className="border-b border-gray-200/80 align-top last:border-0">
                      <td className="px-2 py-4 font-mono text-xs leading-5 text-gray-500">{code}</td>
                      <td className="px-2 py-4">
                        <p className="font-medium leading-5 text-ink">{defect.title}</p>
                        {defect.notes && (
                          <p className="mt-1 whitespace-pre-line text-xs leading-5 text-gray-600">{defect.notes}</p>
                        )}
                      </td>
                      <td
                        className={cn(
                          "px-2 py-4 font-mono text-xs leading-5",
                          defect.testCaseDeleted ? "text-gray-400" : "text-gray-500"
                        )}
                      >
                        {testCaseCell(defect)}
                      </td>
                      <td className="px-2 py-3.5">
                        <Badge tone={SEVERITY_TONES[defect.severity]}>{label("severities", defect.severity)}</Badge>
                      </td>
                      <td className="px-2 py-3.5">
                        <Badge tone={PRIORITY_TONES[defect.priority]}>{label("priorities", defect.priority)}</Badge>
                      </td>
                      <td className="px-2 py-3.5">
                        <Badge tone={STATUS_TONES[defect.status]}>{label("statuses", defect.status)}</Badge>
                      </td>
                      <td className="px-2 py-4 text-xs leading-5 text-gray-600">
                        <p>{formatDefectDate(defect.openedOn, i18n.language)}</p>
                        <p className="text-gray-500">→ {formatDefectDate(defect.closedOn, i18n.language)}</p>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onFormChange({ kind: "edit", number: defect.number })}
                            disabled={form !== null || saving}
                            aria-label={t("defects.editAria", { code })}
                          >
                            {t("defects.edit")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleting(defect)}
                            disabled={form !== null || saving}
                            aria-label={t("defects.deleteAria", { code })}
                          >
                            {t("defects.delete")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t("defects.confirmDeleteTitle", { code: deleting ? formatDefectCode(deleting.number) : "" })}
        description={t("defects.confirmDeleteText")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={() => deleting && remove(deleting)} disabled={saving}>
              {t("defects.delete")}
            </Button>
          </>
        }
      />
    </div>
  );
});

export default DefectReport;
