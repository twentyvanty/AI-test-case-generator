import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RecentRun } from "../../services/dashboard";

function RecentRunsList({ runs }: { runs: RecentRun[] }) {
  const { t } = useTranslation();

  return (
    <ul className="divide-y divide-gray-200/80">
      {runs.map((run) => (
        <li key={run.id}>
          {/* TODO: link to the run's detail page once History exists */}
          <Link
            to="/history"
            className="flex items-center justify-between gap-4 py-3 transition hover:opacity-70"
          >
            <div className="min-w-0">
              <p className="font-mono text-xs text-gray-500">{run.id}</p>
              <p className="truncate text-sm text-ink-soft">{run.title}</p>
            </div>

            <span className="whitespace-nowrap font-mono text-xs text-gray-500">
              {t("dashboard.caseCount", { count: run.caseCount })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default RecentRunsList;
