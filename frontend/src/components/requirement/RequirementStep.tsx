import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TechniqueKey, TechniqueSuggestion } from "../../services/requirements";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Spinner from "../ui/Spinner";
import SpecificationFiles, { type Attachment } from "./SpecificationFiles";
import TechniquePicker from "./TechniquePicker";

// What the page is waiting for (null = nothing)
export type Busy = "saving" | "reading" | "suggesting" | "drafting" | "deleting" | null;

export type RequirementForm = {
  title: string;
  text: string;
  techniques: TechniqueKey[];
};

const fieldClasses =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white/80 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft disabled:opacity-60";

// A numbered card: "1  Describe the requirement"
function Section({
  number,
  title,
  hint,
  children,
}: {
  number: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Card padding="md">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft font-mono text-xs font-semibold text-brand-strong">
          {number}
        </span>

        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-gray-500">{hint}</p>}
        </div>
      </div>

      <div className="mt-4">{children}</div>
    </Card>
  );
}

type RequirementStepProps = {
  form: RequirementForm;
  onChange: (changes: Partial<RequirementForm>) => void;

  attachments: Attachment[];
  readingFiles: string[];
  fileProblems: string[];
  onFiles: (files: File[]) => void;
  onRemoveFile: (fileName: string) => void;

  suggestions: TechniqueSuggestion[];
  onSuggest: () => void;

  busy: Busy;
  error: string | null;
  isSaved: boolean;
  isDirty: boolean;
  // The requirement already has scenarios (drafting again replaces them)
  hasScenarios: boolean;
  // The text was changed after the scenarios were drafted
  textChanged: boolean;

  onSave: () => void;
  onDraft: () => void;
  onDelete: () => void;
};

function RequirementStep({
  form,
  onChange,
  attachments,
  readingFiles,
  fileProblems,
  onFiles,
  onRemoveFile,
  suggestions,
  onSuggest,
  busy,
  error,
  isSaved,
  isDirty,
  hasScenarios,
  textChanged,
  onSave,
  onDraft,
  onDelete,
}: RequirementStepProps) {
  const { t } = useTranslation();
  const locked = busy !== null;
  const complete = form.title.trim() !== "" && form.text.trim() !== "";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Section number={1} title={t("requirementStep.describeTitle")}>
        <label htmlFor="requirement-title" className="text-sm font-medium text-gray-700">
          {t("requirementStep.titleLabel")}
        </label>
        <input
          id="requirement-title"
          value={form.title}
          maxLength={255}
          disabled={locked}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder={t("requirementStep.titlePlaceholder")}
          className={fieldClasses}
        />

        <label htmlFor="requirement-text" className="mt-4 block text-sm font-medium text-gray-700">
          {t("requirementStep.detailsLabel")}
        </label>
        <textarea
          id="requirement-text"
          value={form.text}
          rows={9}
          disabled={locked}
          onChange={(event) => onChange({ text: event.target.value })}
          placeholder={t("requirementStep.detailsPlaceholder")}
          className={`${fieldClasses} resize-y leading-6`}
        />
        <p className="mt-1 text-right text-xs text-gray-500">
          {t("requirementStep.characters", { count: form.text.trim().length })}
        </p>

        {textChanged && (
          <p className="mt-2 rounded-xl bg-warning/10 px-3 py-2 text-xs text-gray-700">
            {t("requirementStep.textChanged")}
          </p>
        )}
      </Section>

      <Section
        number={2}
        title={t("requirementStep.filesTitle")}
        hint={t("requirementStep.filesHint")}
      >
        <SpecificationFiles
          attachments={attachments}
          reading={readingFiles}
          problems={fileProblems}
          onFiles={onFiles}
          onRemove={onRemoveFile}
          disabled={locked}
        />
      </Section>

      <Section
        number={3}
        title={t("requirementStep.techniquesTitle")}
        hint={t("requirementStep.techniquesHint")}
      >
        <TechniquePicker
          selected={form.techniques}
          onChange={(techniques) => onChange({ techniques })}
          suggestions={suggestions}
          onSuggest={onSuggest}
          suggesting={busy === "suggesting"}
          canSuggest={complete}
          disabled={locked}
        />
      </Section>

      <Card padding="md" className="space-y-3">
        {busy === "drafting" && <Spinner label={t("requirementStep.drafting")} />}
        {busy === "suggesting" && <Spinner label={t("requirementStep.suggesting")} />}

        {error && (
          <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onSave} disabled={locked || !complete || !isDirty}>
              {busy === "saving"
                ? t("requirementStep.saving")
                : isSaved && !isDirty
                  ? t("requirementStep.saved")
                  : t("requirementStep.save")}
            </Button>

            {isSaved && (
              <Button variant="ghost" onClick={onDelete} disabled={locked}>
                {t("requirementStep.delete")}
              </Button>
            )}
          </div>

          <Button size="lg" onClick={onDraft} disabled={locked || !complete}>
            {hasScenarios ? t("requirementStep.redraft") : t("requirementStep.draft")}
            <span aria-hidden="true">→</span>
          </Button>
        </div>

        {!complete && <p className="text-xs text-gray-500">{t("requirementStep.missing")}</p>}
        {complete && hasScenarios && (
          <p className="text-xs text-gray-500">{t("requirementStep.redraftNote")}</p>
        )}
      </Card>
    </div>
  );
}

export default RequirementStep;
