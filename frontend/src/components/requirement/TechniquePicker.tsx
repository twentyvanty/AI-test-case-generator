import { useTranslation } from "react-i18next";
import {
  TECHNIQUE_KEYS,
  type TechniqueKey,
  type TechniqueSuggestion,
} from "../../services/requirements";
import { cn } from "../../utils/cn";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

type OptionCardProps = {
  name: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  // The AI's reason, shown after "Suggest with AI"
  reason?: string;
};

function OptionCard({ name, description, selected, disabled, onClick, reason }: OptionCardProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-2xl border bg-white/80 px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60",
        selected
          ? "border-brand-strong ring-1 ring-brand-strong"
          : "border-gray-200 hover:bg-white"
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-ink">{name}</span>
        {selected && <Badge tone="info">{t("techniquePicker.selected")}</Badge>}
      </span>

      <span className="mt-1 block text-xs leading-5 text-gray-500">{description}</span>

      {reason && (
        <span className="mt-2 block rounded-lg bg-brand-soft/60 px-2.5 py-1.5 text-xs leading-5 text-brand-strong">
          {t("techniquePicker.aiReason", { reason })}
        </span>
      )}
    </button>
  );
}

type TechniquePickerProps = {
  // Empty = let the AI choose
  selected: TechniqueKey[];
  onChange: (techniques: TechniqueKey[]) => void;
  suggestions: TechniqueSuggestion[];
  onSuggest: () => void;
  suggesting: boolean;
  // Suggesting needs a title and details first
  canSuggest: boolean;
  disabled: boolean;
};

function TechniquePicker({
  selected,
  onChange,
  suggestions,
  onSuggest,
  suggesting,
  canSuggest,
  disabled,
}: TechniquePickerProps) {
  const { t } = useTranslation();

  const toggle = (technique: TechniqueKey) => {
    onChange(
      selected.includes(technique)
        ? selected.filter((item) => item !== technique)
        : [...selected, technique]
    );
  };

  const reasonFor = (technique: TechniqueKey) =>
    suggestions.find((suggestion) => suggestion.technique === technique)?.reason;

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {TECHNIQUE_KEYS.map((technique) => (
          <OptionCard
            key={technique}
            name={t(`techniques.${technique}`)}
            description={t(`techniqueDescriptions.${technique}`)}
            selected={selected.includes(technique)}
            disabled={disabled}
            onClick={() => toggle(technique)}
            reason={reasonFor(technique)}
          />
        ))}

        <OptionCard
          name={t("techniquePicker.aiChooseName")}
          description={t("techniquePicker.aiChooseDescription")}
          selected={selected.length === 0}
          disabled={disabled}
          onClick={() => onChange([])}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          variant="secondary"
          onClick={onSuggest}
          disabled={disabled || !canSuggest}
        >
          {suggesting ? t("techniquePicker.suggesting") : t("techniquePicker.suggest")}
        </Button>

        <p className="text-xs text-gray-500">{t("techniquePicker.suggestHint")}</p>
      </div>
    </div>
  );
}

export default TechniquePicker;
