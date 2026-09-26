import { useTranslation } from "react-i18next";
import type { Scenario } from "../../services/requirements";
import Button from "../ui/Button";
import EditableTitle from "./EditableTitle";

type ScenarioCardProps = {
  scenario: Scenario;
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onAddCase: () => void;
  onRenameCase: (caseId: string, title: string) => void;
  onDeleteCase: (caseId: string) => void;
};

function ScenarioCard({
  scenario,
  editingId,
  onEditingChange,
  onRename,
  onDelete,
  onAddCase,
  onRenameCase,
  onDeleteCase,
}: ScenarioCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-gray-500">{scenario.id}</p>

          <EditableTitle
            value={scenario.title}
            editing={editingId === scenario.id}
            onStartEdit={() => onEditingChange(scenario.id)}
            onSave={(title) => {
              onRename(title);
              onEditingChange(null);
            }}
            onCancel={() => onEditingChange(null)}
            className="mt-0.5 font-semibold text-ink"
          />

          <p className="mt-0.5 text-xs text-gray-500">
            {t("requirements.caseCount", { count: scenario.cases.length })}
          </p>
        </div>

        <div className="flex gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => onEditingChange(scenario.id)}>
            {t("review.edit")}
          </Button>
          <Button variant="secondary" size="sm" onClick={onAddCase}>
            + {t("review.addCase")}
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            {t("review.delete")}
          </Button>
        </div>
      </div>

      {scenario.cases.length > 0 && (
        <ul className="mt-3 divide-y divide-gray-200/80">
          {scenario.cases.map((testCase) => (
            <li
              key={testCase.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-gray-500">{testCase.id}</p>

                <EditableTitle
                  value={testCase.title}
                  editing={editingId === testCase.id}
                  onStartEdit={() => onEditingChange(testCase.id)}
                  onSave={(title) => {
                    onRenameCase(testCase.id, title);
                    onEditingChange(null);
                  }}
                  onCancel={() => onEditingChange(null)}
                  className="text-sm font-medium text-ink"
                />
              </div>

              <Button variant="danger" size="sm" onClick={() => onDeleteCase(testCase.id)}>
                {t("review.delete")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ScenarioCard;
