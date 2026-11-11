import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatRequirementCode } from "../../services/requirements";
import type { GenerationHistoryItem, GenerationKind } from "../../services/history";
import { cn } from "../../utils/cn";
import { formatRelativeTime } from "../../utils/format";
import Badge from "../ui/Badge";
import ButtonLink from "../ui/ButtonLink";

const SHOWN = 5;

type Filter = "all" | GenerationKind;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "historyGenerated.filter.all" },
  { value: "SCENARIOS", label: "historyGenerated.filter.scenarios" },
  { value: "TEST_CASES", label: "historyGenerated.filter.testCases" },
];

// Where "Open" goes: the requirement's scenarios or test cases step
const openLink = (item: GenerationHistoryItem) =>
  `/projects/${item.projectId}/requirements/${item.requirementNumber}?step=${
    item.kind === "TEST_CASES" ? "testCases" : "scenarios"
  }`;

type GeneratedListProps = {
  items: GenerationHistoryItem[];
};

// History → "Generated": finished AI generations, newest first
function GeneratedList({ items }: GeneratedListProps) {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);

  const filtered = filter === "all" ? items : items.filter((item) => item.kind === filter);
  const shown = showAll ? filtered : filtered.slice(0, SHOWN);

  return (
    <div>
      <div role="group" className="mt-4 flex flex-wrap gap-1.5">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => {
              setFilter(option.value);
              setShowAll(false);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              filter === option.value
                ? "border-ink bg-ink text-white"
                : "border-gray-200 bg-white/80 text-gray-600 hover:text-ink"
            )}
          >
            {t(option.label)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">{t("historyGenerated.empty")}</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-200/80">
          {shown.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-gray-500">
                  <Badge tone={item.kind === "TEST_CASES" ? "info" : "neutral"}>
                    {t(item.kind === "TEST_CASES" ? "historyGenerated.kind.testCases" : "historyGenerated.kind.scenarios")}
                  </Badge>
                  {item.status === "NEEDS_REVIEW" && (
                    <Badge tone="warning">{t("runStatus.NEEDS_REVIEW")}</Badge>
                  )}
                  {formatRequirementCode(item.requirementNumber)}
                </p>
                <p className="mt-1 font-semibold text-ink">{item.requirementTitle}</p>
                <p className="mt-0.5 text-sm text-gray-500">
                  {item.kind === "TEST_CASES"
                    ? t("historyGenerated.caseCount", { count: item.itemCount })
                    : t("historyGenerated.scenarioCount", { count: item.itemCount })}
                  {item.mode && ` · ${t(`historyGenerated.mode.${item.mode}`)}`}
                  {" · "}
                  {item.projectName}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatRelativeTime(item.createdAt, i18n.language)}
                </p>
              </div>

              <ButtonLink to={openLink(item)} variant="secondary" size="sm">
                {t("historyGenerated.open")}
              </ButtonLink>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > SHOWN && (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="mt-2 text-sm font-medium text-brand-strong hover:underline"
        >
          {showAll
            ? t("historyGenerated.showLess")
            : t("historyGenerated.showAll", { count: filtered.length })}
        </button>
      )}
    </div>
  );
}

export default GeneratedList;
