import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  allCases,
  nextId,
  type Requirement,
  type Scenario,
} from "../../services/requirements";
import Button from "../ui/Button";
import Card from "../ui/Card";
import ScenarioCard from "./ScenarioCard";

type ReviewStepProps = {
  requirement: Requirement;
  generatingMore: boolean;
  onChange: (requirement: Requirement) => void;
  onGenerateMore: () => void;
  onContinue: () => void;
};

function ReviewStep({
  requirement,
  generatingMore,
  onChange,
  onGenerateMore,
  onContinue,
}: ReviewStepProps) {
  const { t } = useTranslation();
  // id of the scenario or test case whose title is being edited
  const [editingId, setEditingId] = useState<string | null>(null);

  const { scenarios } = requirement;
  const caseIds = allCases(scenarios).map((item) => item.id);

  const setScenarios = (next: Scenario[]) => onChange({ ...requirement, scenarios: next });

  const updateScenario = (id: string, update: (scenario: Scenario) => Scenario) =>
    setScenarios(scenarios.map((item) => (item.id === id ? update(item) : item)));

  const addScenario = () => {
    const id = nextId("SC-", scenarios.map((item) => item.id), 2);

    setScenarios([...scenarios, { id, title: t("review.newScenario"), cases: [] }]);
    setEditingId(id);
  };

  const addCase = (scenarioId: string) => {
    const id = nextId("TC-", caseIds, 4);

    updateScenario(scenarioId, (scenario) => ({
      ...scenario,
      cases: [
        ...scenario.cases,
        {
          id,
          title: t("review.newCase"),
          precondition: "",
          steps: [],
          expectedResult: "",
          status: "open",
        },
      ],
    }));
    setEditingId(id);
  };

  const deleteScenario = (scenario: Scenario) => {
    if (window.confirm(t("review.confirmDeleteScenario", { title: scenario.title }))) {
      setScenarios(scenarios.filter((item) => item.id !== scenario.id));
    }
  };

  return (
    <Card padding="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">
            {t("review.title")}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{t("review.description")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={addScenario}>
            + {t("review.addScenario")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={generatingMore}
            onClick={onGenerateMore}
          >
            {generatingMore ? t("setup.generating") : t("review.generateMore")}
          </Button>
          <Button
            variant="brand"
            size="sm"
            disabled={caseIds.length === 0}
            onClick={onContinue}
          >
            {t("review.continue")} <span aria-hidden="true">→</span>
          </Button>
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-track/70 px-4 py-2 text-sm text-gray-600">
        {t("review.scenarioCount", { count: scenarios.length })}
        {" · "}
        {t("requirements.caseCount", { count: caseIds.length })}
      </p>

      <div className="mt-4 space-y-3">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            editingId={editingId}
            onEditingChange={setEditingId}
            onRename={(title) => updateScenario(scenario.id, (item) => ({ ...item, title }))}
            onDelete={() => deleteScenario(scenario)}
            onAddCase={() => addCase(scenario.id)}
            onRenameCase={(caseId, title) =>
              updateScenario(scenario.id, (item) => ({
                ...item,
                cases: item.cases.map((testCase) =>
                  testCase.id === caseId ? { ...testCase, title } : testCase
                ),
              }))
            }
            onDeleteCase={(caseId) =>
              updateScenario(scenario.id, (item) => ({
                ...item,
                cases: item.cases.filter((testCase) => testCase.id !== caseId),
              }))
            }
          />
        ))}
      </div>
    </Card>
  );
}

export default ReviewStep;
