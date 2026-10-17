import { useTranslation } from "react-i18next";
import { PRIORITIES, type ScenarioPriority } from "../../services/requirements";
import { cn } from "../../utils/cn";

const toneClasses: Record<ScenarioPriority, string> = {
  HIGH: "bg-danger/10 text-danger",
  MEDIUM: "bg-warning/15 text-warning",
  LOW: "bg-track text-gray-600",
};

type PrioritySelectProps = {
  value: ScenarioPriority;
  onChange: (priority: ScenarioPriority) => void;
  disabled?: boolean;
  // Accessible name, e.g. "Priority of SC-01"
  label: string;
};

// A dropdown that looks like a small coloured pill (High red, Medium amber, Low grey)
function PrioritySelect({ value, onChange, disabled = false, label }: PrioritySelectProps) {
  const { t } = useTranslation();

  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as ScenarioPriority)}
      className={cn(
        "cursor-pointer rounded-full border-0 py-0.5 pl-2.5 pr-7 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-brand-soft disabled:cursor-not-allowed disabled:opacity-60",
        toneClasses[value]
      )}
    >
      {PRIORITIES.map((priority) => (
        <option key={priority} value={priority}>
          {t(`priority.${priority}`)}
        </option>
      ))}
    </select>
  );
}

export default PrioritySelect;
