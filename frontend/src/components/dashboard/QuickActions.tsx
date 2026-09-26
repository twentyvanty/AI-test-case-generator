import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";

const actions = [
  // TODO: point "Start a new run" at the generate page once it exists
  { to: "/workspace", labelKey: "dashboard.startNewRun", primary: true },
  { to: "/workspace", labelKey: "dashboard.projectOverview", primary: false },
  { to: "/history", labelKey: "dashboard.browseHistory", primary: false },
];

function QuickActions() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      {actions.map((action) => (
        <Link
          key={action.labelKey}
          to={action.to}
          className={cn(
            "flex items-center justify-between rounded-xl px-4 py-3 font-heading text-sm font-semibold transition",
            action.primary
              ? "bg-ink text-white hover:bg-ink-soft"
              : "border border-white/80 bg-white/70 text-ink hover:bg-white"
          )}
        >
          <span>{t(action.labelKey)}</span>
          <span aria-hidden="true">→</span>
        </Link>
      ))}
    </div>
  );
}

export default QuickActions;
