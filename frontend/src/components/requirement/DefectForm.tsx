import { useId, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFECT_PRIORITIES,
  DEFECT_SEVERITIES,
  DEFECT_STATUSES,
  todayIso,
  type Defect,
  type DefectInput,
  type DefectStatus,
} from "../../services/defects";
import { formatTestCaseCode, type TestCase } from "../../services/requirements";
import Button from "../ui/Button";

const fieldClasses =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft";

const labelClasses = "text-xs font-medium text-gray-600";

const OPEN_STATUSES: DefectStatus[] = ["OPEN", "IN_PROGRESS"];

type Values = {
  title: string;
  testCaseNumber: number | null;
  severity: Defect["severity"];
  priority: Defect["priority"];
  status: DefectStatus;
  openedOn: string;
  closedOn: string; // "" = none
  notes: string;
};

type DefectFormProps = {
  // null = a new defect
  defect: Defect | null;
  // The code it will get (new) or has (edit), e.g. "DEF-3"
  code: string;
  testCases: TestCase[];
  // New defect from a test case's ⋯ menu: that case is linked already
  initialTestCaseNumber?: number | null;
  saving: boolean;
  // Only the fields that changed are sent on an edit
  onSave: (input: DefectInput) => void;
  onCancel: () => void;
};

function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className={labelClasses}>
        {label}
      </label>
      {children(id)}
    </div>
  );
}

const valuesOf = (defect: Defect | null, testCaseNumber: number | null): Values =>
  defect
    ? {
        title: defect.title,
        testCaseNumber: defect.testCaseNumber,
        severity: defect.severity,
        priority: defect.priority,
        status: defect.status,
        openedOn: defect.openedOn,
        closedOn: defect.closedOn ?? "",
        notes: defect.notes,
      }
    : {
        title: "",
        testCaseNumber,
        severity: "MAJOR",
        priority: "MEDIUM",
        status: "OPEN",
        openedOn: todayIso(),
        closedOn: "",
        notes: "",
      };

// Add or edit a defect (inline, as in the mock-up): name, linked test case,
// severity, priority, status, dates and notes. Screenshots come in part 6b-2.
function DefectForm({
  defect,
  code,
  testCases,
  initialTestCaseNumber = null,
  saving,
  onSave,
  onCancel,
}: DefectFormProps) {
  const { t } = useTranslation();
  const [initial] = useState(() => valuesOf(defect, initialTestCaseNumber));
  const [values, setValues] = useState(initial);
  const [problem, setProblem] = useState<string | null>(null);

  // Any change hides the last error message; it's checked again on save
  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setProblem(null);
    setValues((current) => ({ ...current, [key]: value }));
  };

  // Same rules as the backend, so the tester sees them before saving:
  // Closed → closed today if empty; back to Open / In progress → no close date
  const changeStatus = (status: DefectStatus) => {
    setProblem(null);
    setValues((current) => ({
      ...current,
      status,
      closedOn:
        status === "CLOSED" && current.closedOn === ""
          ? todayIso()
          : OPEN_STATUSES.includes(status)
            ? ""
            : current.closedOn,
    }));
  };

  // A linked test case that's in Recently deleted stays selectable as it is
  const linkedDeleted =
    defect?.testCaseDeleted && defect.testCaseNumber !== null ? defect.testCaseNumber : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (values.title.trim() === "") {
      setProblem(t("defects.errName"));
      return;
    }

    if (values.openedOn === "") {
      setProblem(t("defects.errOpen"));
      return;
    }

    if (values.closedOn !== "" && values.closedOn < values.openedOn) {
      setProblem(t("defects.errDates"));
      return;
    }

    const next: DefectInput = {
      title: values.title.trim(),
      testCaseNumber: values.testCaseNumber,
      severity: values.severity,
      priority: values.priority,
      status: values.status,
      openedOn: values.openedOn,
      closedOn: values.closedOn === "" ? null : values.closedOn,
      notes: values.notes.trim(),
    };

    if (!defect) {
      onSave(next);
      return;
    }

    // Only what changed (e.g. a link to a deleted test case is never re-sent)
    const before: DefectInput = {
      ...initial,
      closedOn: initial.closedOn === "" ? null : initial.closedOn,
    };
    const changes = Object.fromEntries(
      Object.entries(next).filter(([key, value]) => before[key as keyof DefectInput] !== value)
    ) as DefectInput;

    if (Object.keys(changes).length === 0) {
      onCancel();
      return;
    }

    onSave(changes);
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={defect ? t("defects.editTitle", { code }) : t("defects.newTitle")}
      className="my-3 space-y-4 rounded-2xl border border-brand/20 bg-brand-soft/30 p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-heading text-base font-semibold text-ink">
          {defect ? t("defects.editTitle", { code }) : t("defects.newTitle")}
        </h3>
        {!defect && <p className="text-xs text-gray-500">{t("defects.idAuto", { code })}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field label={t("defects.name")}>
          {(id) => (
            <input
              id={id}
              value={values.title}
              maxLength={255}
              onChange={(event) => set("title", event.target.value)}
              placeholder={t("defects.namePlaceholder")}
              className={fieldClasses}
              autoFocus
            />
          )}
        </Field>

        <Field label={t("defects.testCase")}>
          {(id) => (
            <select
              id={id}
              value={values.testCaseNumber ?? ""}
              onChange={(event) =>
                set("testCaseNumber", event.target.value === "" ? null : Number(event.target.value))
              }
              className={fieldClasses}
            >
              <option value="">{t("defects.noTestCase")}</option>
              {linkedDeleted !== null && (
                <option value={linkedDeleted}>
                  {t("defects.deletedTestCase", { code: formatTestCaseCode(linkedDeleted) })}
                </option>
              )}
              {testCases.map((testCase) => (
                <option key={testCase.id} value={testCase.number}>
                  {formatTestCaseCode(testCase.number)} · {testCase.title}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        <Field label={t("defects.severity")}>
          {(id) => (
            <select
              id={id}
              value={values.severity}
              onChange={(event) => set("severity", event.target.value as Values["severity"])}
              className={fieldClasses}
            >
              {DEFECT_SEVERITIES.map((severity) => (
                <option key={severity} value={severity}>
                  {t(`defects.severities.${severity}`)}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label={t("defects.priority")}>
          {(id) => (
            <select
              id={id}
              value={values.priority}
              onChange={(event) => set("priority", event.target.value as Values["priority"])}
              className={fieldClasses}
            >
              {DEFECT_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`defects.priorities.${priority}`)}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label={t("defects.status")}>
          {(id) => (
            <select
              id={id}
              value={values.status}
              onChange={(event) => changeStatus(event.target.value as DefectStatus)}
              className={fieldClasses}
            >
              {DEFECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`defects.statuses.${status}`)}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label={t("defects.openDate")}>
          {(id) => (
            <input
              id={id}
              type="date"
              value={values.openedOn}
              onChange={(event) => set("openedOn", event.target.value)}
              className={fieldClasses}
            />
          )}
        </Field>

        <Field label={t("defects.closeDate")}>
          {(id) => (
            <input
              id={id}
              type="date"
              value={values.closedOn}
              onChange={(event) => set("closedOn", event.target.value)}
              className={fieldClasses}
            />
          )}
        </Field>
      </div>

      <Field label={t("defects.notes")}>
        {(id) => (
          <textarea
            id={id}
            rows={3}
            maxLength={5000}
            value={values.notes}
            onChange={(event) => set("notes", event.target.value)}
            placeholder={t("defects.notesPlaceholder")}
            className={`${fieldClasses} resize-y`}
          />
        )}
      </Field>

      {problem && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
          {problem}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          {t("defects.cancel")}
        </Button>
        <Button type="submit" variant="brand" size="sm" disabled={saving}>
          {t("defects.save")}
        </Button>
      </div>
    </form>
  );
}

export default DefectForm;
