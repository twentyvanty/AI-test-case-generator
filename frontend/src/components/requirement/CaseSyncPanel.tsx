import { useTranslation } from "react-i18next";
import { formatScenarioCode, type Scenario } from "../../services/requirements";
import Button from "../ui/Button";

type CaseSyncPanelProps = {
  // Scenarios that have no test cases yet, while others already have some
  pending: Scenario[];
  disabled: boolean;
  onGenerate: () => void;
};

// "Test cases may be out of date". Scenarios with test cases are locked (D-029),
// so the only way to get out of date is adding scenarios after generating:
// this lists them and generates test cases for just those.
function CaseSyncPanel({ pending, disabled, onGenerate }: CaseSyncPanelProps) {
  const { t } = useTranslation();
  const estimated = pending.reduce((sum, scenario) => sum + (scenario.estimatedCases || 3), 0);

  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/10 px-5 py-4 text-sm">
      <p className="font-medium text-ink">{t("caseSync.title")}</p>
      <p className="mt-1 text-gray-600">{t("caseSync.text", { count: pending.length })}</p>

      <ul className="mt-2 space-y-1 text-gray-700">
        {pending.map((scenario) => (
          <li key={scenario.id}>
            •{" "}
            {t("caseSync.added", {
              code: formatScenarioCode(scenario.number),
              title: scenario.title,
            })}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end">
        <Button variant="brand" size="sm" onClick={onGenerate} disabled={disabled}>
          {t("caseSync.generate", { count: estimated })}
        </Button>
      </div>
    </div>
  );
}

export default CaseSyncPanel;
