import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { TECHNIQUE_KEYS, type ScenarioInput, type TechniqueKey } from "../../services/requirements";
import Button from "../ui/Button";

const fieldClasses =
  "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft";

const labelClasses = "text-xs font-medium text-gray-600";

type ScenarioFormProps = {
  initial: ScenarioInput;
  saving: boolean;
  onSave: (input: ScenarioInput) => void;
  onCancel: () => void;
};

// Add / edit a scenario: title, description, technique, estimated cases
function ScenarioForm({ initial, saving, onSave, onCancel }: ScenarioFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState(initial);

  const change = (changes: Partial<ScenarioInput>) =>
    setValues((current) => ({ ...current, ...changes }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (values.title.trim() !== "") {
      onSave({ ...values, title: values.title.trim(), description: values.description.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className={labelClasses}>{t("scenarioForm.title")}</span>
        <input
          autoFocus
          value={values.title}
          maxLength={255}
          onChange={(event) => change({ title: event.target.value })}
          className={fieldClasses}
        />
      </label>

      <label className="block">
        <span className={labelClasses}>{t("scenarioForm.description")}</span>
        <textarea
          value={values.description}
          rows={3}
          maxLength={2000}
          onChange={(event) => change({ description: event.target.value })}
          className={`${fieldClasses} resize-y leading-6`}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClasses}>{t("scenarioForm.technique")}</span>
          <select
            value={values.technique ?? ""}
            onChange={(event) =>
              change({ technique: (event.target.value || null) as TechniqueKey | null })
            }
            className={fieldClasses}
          >
            <option value="">{t("scenarioForm.noTechnique")}</option>
            {TECHNIQUE_KEYS.map((technique) => (
              <option key={technique} value={technique}>
                {t(`techniques.${technique}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClasses}>{t("scenarioForm.estimatedCases")}</span>
          <input
            type="number"
            min={0}
            max={20}
            value={values.estimatedCases}
            onChange={(event) =>
              change({ estimatedCases: Math.min(20, Math.max(0, Math.round(Number(event.target.value) || 0))) })
            }
            className={fieldClasses}
          />
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" variant="brand" size="sm" disabled={saving || values.title.trim() === ""}>
          {saving ? t("scenarioForm.saving") : t("scenarioForm.save")}
        </Button>
      </div>
    </form>
  );
}

export default ScenarioForm;
