import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getRecentRuns, type RecentRun } from "../../services/dashboard";
import { cn } from "../../utils/cn";
import Card from "../ui/Card";
import SectionLabel from "../ui/SectionLabel";
import { navItems } from "./navItems";

function Sidebar() {
  const { t } = useTranslation();
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);

  useEffect(() => {
    getRecentRuns()
      .then(setRecentRuns)
      .catch((error) => console.error("Failed to load recent runs:", error));
  }, []);

  return (
    <Card padding="none" className="p-3">
      <SectionLabel className="px-3 pt-2">{t("sidebar.sections")}</SectionLabel>

      <nav className="mt-3 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "rounded-xl px-3 py-2 text-sm transition",
                isActive
                  ? "bg-brand-soft font-semibold text-brand-strong"
                  : "text-gray-600 hover:bg-white/70 hover:text-ink"
              )
            }
          >
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>

      {recentRuns.length > 0 && (
        <>
          <div className="my-4 border-t border-gray-200/80" />

          <SectionLabel className="px-3">{t("sidebar.recentRuns")}</SectionLabel>

          <ul className="mt-2 flex flex-col gap-0.5">
            {recentRuns.map((run) => (
              <li key={run.id}>
                {/* TODO: link to the run's detail page once History exists */}
                <Link
                  to="/history"
                  className="block rounded-xl px-3 py-2 transition hover:bg-white/70"
                >
                  <span className="block font-mono text-xs text-gray-500">
                    {run.id}
                  </span>
                  <span className="block text-sm text-ink-soft">{run.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

export default Sidebar;
