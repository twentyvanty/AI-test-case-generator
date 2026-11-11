import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
import Card from "../ui/Card";

type StepPlaceholderProps = {
  step: "testCases" | "testScripts" | "report";
  // Test cases: how many exist (the page itself comes in the next part)
  count?: number;
  onBack: () => void;
};

// Steps that arrive in later parts: the test-case page (Slice 5c-2), test
// scripts and the report (Slices 6–7)
function StepPlaceholder({ step, count = 0, onBack }: StepPlaceholderProps) {
  const { t } = useTranslation();

  return (
    <Card padding="md">
      <h2 className="font-heading text-lg font-semibold tracking-tight text-ink">
        {t(`steps.${step}`)}
      </h2>
      <p className="mt-1 text-sm text-gray-500">{t(`stepPlaceholder.${step}`, { count })}</p>

      <Button variant="secondary" size="sm" className="mt-4" onClick={onBack}>
        <span aria-hidden="true">←</span>{" "}
        {step === "testCases" ? t("stepPlaceholder.backToScenarios") : t("stepPlaceholder.back")}
      </Button>
    </Card>
  );
}

export default StepPlaceholder;
