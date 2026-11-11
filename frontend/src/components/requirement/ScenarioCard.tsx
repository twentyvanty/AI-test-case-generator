import { useTranslation } from "react-i18next";
import { formatScenarioCode, type Scenario, type ScenarioInput } from "../../services/requirements";
import Button from "../ui/Button";
import ScenarioForm from "./ScenarioForm";

type ScenarioCardProps = {
  scenario: Scenario;
  editing: boolean;
  saving: boolean;
  disabled: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (input: ScenarioInput) => void;
  onDelete: () => void;
};

function ScenarioCard({
  scenario,
  editing,
  saving,
  disabled,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: ScenarioCardProps) {
  const { t } = useTranslation();
  const code = formatScenarioCode(scenario.number);

  if (editing) {
    return (
      <div className="rounded-2xl border border-brand/40 bg-white/80 p-4">
        <p className="mb-3 font-mono text-xs text-gray-500">{code}</p>
        <ScenarioForm
          initial={{
            title: scenario.title,
            description: scenario.description,
            technique: scenario.technique,
            estimatedCases: scenario.estimatedCases,
          }}
          saving={saving}
          onSave={onSave}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-gray-500">
            {code}
            {scenario.source === "MANUAL" && ` · ${t("scenariosStep.manual")}`}
          </p>

          <p className="mt-1 font-semibold text-ink">{scenario.title}</p>

          <p className="mt-1 text-xs text-gray-500">
            {scenario.technique
              ? t(`techniques.${scenario.technique}`)
              : t("scenarioForm.noTechnique")}
            {" · "}
            {t("scenariosStep.estimatedCases", { count: scenario.estimatedCases })}
          </p>

          {scenario.description && (
            <p className="mt-2 text-sm leading-6 text-gray-600">{scenario.description}</p>
          )}
        </div>

        <div className="flex gap-1.5">
          <Button variant="secondary" size="sm" onClick={onEdit} disabled={disabled}>
            {t("scenariosStep.edit")}
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete} disabled={disabled}>
            {t("scenariosStep.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ScenarioCard;
