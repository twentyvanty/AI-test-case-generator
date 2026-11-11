import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { TestCase, TestCaseChanges } from "../../services/requirements";
import Button from "../ui/Button";

const fieldClasses =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft";

const labelClasses = "text-xs font-medium text-gray-600";

type TestCaseFormProps = {
  testCase: TestCase;
  saving: boolean;
  onSave: (changes: TestCaseChanges) => void;
  onCancel: () => void;
};

// Edit a test case: title, precondition, steps (one per line), expected result
function TestCaseForm({ testCase, saving, onSave, onCancel }: TestCaseFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(testCase.title);
  const [precondition, setPrecondition] = useState(testCase.precondition);
  const [steps, setSteps] = useState(testCase.steps.join("\n"));
  const [expectedResult, setExpectedResult] = useState(testCase.expectedResult);
  const [problem, setProblem] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const stepList = steps
      .split("\n")
      .map((step) => step.trim())
      .filter(Boolean);

    if (title.trim() === "") {
      setProblem(t("testCasesStep.errTitle"));
      return;
    }

    if (stepList.length === 0) {
      setProblem(t("testCasesStep.errSteps"));
      return;
    }

    if (expectedResult.trim() === "") {
      setProblem(t("testCasesStep.errExpected"));
      return;
    }

    onSave({
      title: title.trim(),
      precondition: precondition.trim(),
      steps: stepList,
      expectedResult: expectedResult.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className={labelClasses}>{t("testCasesStep.fields.title")}</span>
        <input
          autoFocus
          value={title}
          maxLength={255}
          onChange={(event) => setTitle(event.target.value)}
          className={fieldClasses}
        />
      </label>

      <label className="block">
        <span className={labelClasses}>{t("testCasesStep.fields.precondition")}</span>
        <textarea
          value={precondition}
          rows={2}
          maxLength={2000}
          onChange={(event) => setPrecondition(event.target.value)}
          className={`${fieldClasses} resize-y leading-6`}
        />
      </label>

      <label className="block">
        <span className={labelClasses}>
          {t("testCasesStep.fields.steps")}{" "}
          <span className="font-normal text-gray-500">· {t("testCasesStep.fields.stepsHint")}</span>
        </span>
        <textarea
          value={steps}
          rows={5}
          onChange={(event) => setSteps(event.target.value)}
          className={`${fieldClasses} resize-y leading-6`}
        />
      </label>

      <label className="block">
        <span className={labelClasses}>{t("testCasesStep.fields.expected")}</span>
        <textarea
          value={expectedResult}
          rows={2}
          maxLength={2000}
          onChange={(event) => setExpectedResult(event.target.value)}
          className={`${fieldClasses} resize-y leading-6`}
        />
      </label>

      {problem && (
        <p role="alert" className="text-xs text-danger">
          {problem}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" variant="brand" disabled={saving}>
          {saving ? t("testCasesStep.saving") : t("testCasesStep.save")}
        </Button>
      </div>
    </form>
  );
}

export default TestCaseForm;
