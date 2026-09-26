import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";

export const STEPS = ["setup", "review", "validate"] as const;
export type Step = (typeof STEPS)[number];

type StepTabsProps = {
  active: Step;
  onChange: (step: Step) => void;
  // Steps that can't be opened yet (e.g. nothing generated)
  disabled?: Step[];
};

function StepTabs({ active, onChange, disabled = [] }: StepTabsProps) {
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
            disabled={disabled.includes(step)}
            onClick={() => onChange(step)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-40",
              isActive
                ? "border-brand-strong font-medium text-brand-strong"
                : "border-transparent text-gray-500 hover:text-ink"
            )}
          >
            {index + 1}. {t(`steps.${step}`)}
          </button>
        );
      })}
    </div>
  );
}

export default StepTabs;
