import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getDashboardSummary,
  getRecentRuns,
  type DashboardSummary,
  type RecentRun,
} from "../services/dashboard";
import BreakdownCard from "../components/dashboard/BreakdownCard";
import CardTitle from "../components/ui/CardTitle";
import QuickActions from "../components/dashboard/QuickActions";
import RecentRunsList from "../components/dashboard/RecentRunsList";
import StatCard from "../components/dashboard/StatCard";
import WeeklyActivityChart from "../components/dashboard/WeeklyActivityChart";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";

// 12 → "+12", -1 → "−1", 6 with "%" → "+6%"
function formatDelta(delta: number, suffix = "") {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";

  return `${sign}${Math.abs(delta)}${suffix}`;
}

function DashboardPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([getDashboardSummary(), getRecentRuns()])
      .then(([summaryData, runsData]) => {
        setSummary(summaryData);
        setRecentRuns(runsData);
      })
      .catch((error) => {
        console.error("Failed to load dashboard:", error);
        setError(true);
      });
  }, []);

  const vsLastWeek = (delta: number, suffix?: string) =>
    t("dashboard.vsLastWeek", { delta: formatDelta(delta, suffix) });

  return (
    <main className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink">
          {t("dashboard.title")}
        </h1>

        <span className="font-mono text-xs text-gray-500">
          {t("dashboard.period")}
        </span>
      </div>

      {error && <p className="text-danger">{t("dashboard.loadError")}</p>}

      {!error && !summary && <Spinner label={t("common.loading")} />}

      {summary && (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <StatCard
              label={t("dashboard.stats.totalTestCases")}
              value={String(summary.totalTestCases.value)}
              delta={vsLastWeek(summary.totalTestCases.deltaVsLastWeek)}
            />

            <StatCard
              label={t("dashboard.stats.passRate")}
              value={`${summary.passRate.value}%`}
              delta={vsLastWeek(summary.passRate.deltaVsLastWeek, "%")}
              tone="success"
            />

            <StatCard
              label={t("dashboard.stats.failingCases")}
              value={String(summary.failingCases.value)}
              delta={vsLastWeek(summary.failingCases.deltaVsLastWeek)}
              tone="danger"
            />

            <StatCard
              label={t("dashboard.stats.runsThisWeek")}
              value={String(summary.runsThisWeek.value)}
              delta={vsLastWeek(summary.runsThisWeek.deltaVsLastWeek)}
            />
          </section>

          <WeeklyActivityChart data={summary.weeklyActivity} />

          <BreakdownCard
            title={t("dashboard.techniqueMix")}
            rows={summary.techniqueMix.map((item) => ({
              key: item.technique,
              label: t(`techniques.${item.technique}`),
              count: item.count,
            }))}
          />

          <BreakdownCard
            title={t("dashboard.failingByArea")}
            tone="danger"
            monoValues
            rows={summary.failingByArea.map((item) => ({
              key: item.area,
              label: item.area,
              count: item.failCount,
              valueLabel: t("dashboard.failCount", { count: item.failCount }),
            }))}
          />

          <Card padding="md">
            <CardTitle>{t("dashboard.quickActions")}</CardTitle>

            <div className="mt-4">
              <QuickActions />
            </div>

            <div className="mt-7">
              <CardTitle>{t("dashboard.recentRuns")}</CardTitle>

              <div className="mt-1">
                <RecentRunsList runs={recentRuns} />
              </div>
            </div>
          </Card>
        </>
      )}
    </main>
  );
}

export default DashboardPage;
