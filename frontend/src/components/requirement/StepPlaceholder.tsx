import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
import Card from "../ui/Card";

type StepPlaceholderProps = {
  onBack: () => void;
  onSkip: () => void;
};

// Step 4 (test scripts) arrives in Slice 7. It's optional, so the report is one
// click away.
function StepPlaceholder({ onBack, onSkip }: StepPlaceholderProps) {
  const { t } = useTranslation();

  return (
    <Card padding="md">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">
        {t("steps.testScripts")}
      </h2>
      <p className="mt-1 text-sm text-gray-500">{t("stepPlaceholder.testScripts")}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onBack}>
          <span aria-hidden="true">←</span> {t("stepPlaceholder.back")}
        </Button>
        <Button variant="brand" size="sm" onClick={onSkip}>
          {t("stepPlaceholder.skipToReport")} <span aria-hidden="true">→</span>
        </Button>
      </div>
    </Card>
  );
}

export default StepPlaceholder;
