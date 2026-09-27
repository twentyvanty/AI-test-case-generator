import { useTranslation } from "react-i18next";
import type { RequirementStatus } from "../../services/requirements";
import { cn } from "../../utils/cn";
import { isStepUnlocked, STEPS, type Step } from "./steps";

type StepTabsProps = {
  active: Step;
  status: RequirementStatus | null;
  onChange: (step: Step) => void;
};

function StepTabs({ active, status, onChange }: StepTabsProps) {
  const { t } = useTranslation();

  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200/80">
      {STEPS.map((step, index) => {
        const isActive = step === active;

        return (
          <button
            key={step}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={!isStepUnlocked(step, status)}
            onClick={() => onChange(step)}
            className={cn(
              "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40",
              isActive
                ? "border-brand-strong font-medium text-brand-strong"
                : "border-transparent text-gray-500 hover:text-ink"
            )}
          >
            <span className="font-mono text-xs">{String(index + 1).padStart(2, "0")}</span>
            {t(`steps.${step}`)}
          </button>
        );
      })}
    </div>
  );
}

export default StepTabs;
