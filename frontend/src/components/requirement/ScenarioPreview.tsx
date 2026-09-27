import { useTranslation } from "react-i18next";
import {
  formatScenarioCode,
  issuesOf,
  type RunSummary,
  type Scenario,
} from "../../services/requirements";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";

type ScenarioPreviewProps = {
  scenarios: Scenario[];
  latestRun: RunSummary | null;
};

// Step 2 for now: a read-only list of the drafted scenarios.
// Editing, selecting, redrafting and history come in Slice 4.
function ScenarioPreview({ scenarios, latestRun }: ScenarioPreviewProps) {
  const { t } = useTranslation();
  const needsReview = latestRun?.status === "NEEDS_REVIEW";
  const issues = needsReview ? issuesOf(latestRun?.validation?.final) : [];

  return (
    <div className="space-y-4">
      {needsReview && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 px-5 py-4 text-sm">
          <p className="font-medium text-ink">{t("scenarioPreview.needsReviewTitle")}</p>
          <p className="mt-1 text-gray-600">{t("scenarioPreview.needsReviewText")}</p>

          {issues.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-600">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Card padding="md">
        <CardTitle aside={t("scenarioPreview.count", { count: scenarios.length })}>
          {t("scenarioPreview.title")}
        </CardTitle>

        <p className="mt-1 text-sm text-gray-500">{t("scenarioPreview.note")}</p>

        <ul className="mt-3 divide-y divide-gray-200/80">
          {scenarios.map((scenario) => (
            <li key={scenario.id} className="py-4">
              <p className="font-mono text-xs text-gray-500">
                {formatScenarioCode(scenario.number)}
                {" · "}
                {scenario.technique
                  ? t(`techniques.${scenario.technique}`)
                  : t("scenarioPreview.noTechnique")}
                {" · "}
                {t("scenarioPreview.estimatedCases", { count: scenario.estimatedCases })}
              </p>
              <p className="mt-1 font-medium text-ink">{scenario.title}</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">{scenario.description}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default ScenarioPreview;
