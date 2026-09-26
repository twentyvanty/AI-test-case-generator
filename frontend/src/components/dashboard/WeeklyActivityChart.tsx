import { useTranslation } from "react-i18next";
import type { Weekday } from "../../services/dashboard";
import Card from "../ui/Card";
import CardTitle from "../ui/CardTitle";

type WeeklyActivityChartProps = {
  data: { day: Weekday; count: number }[];
};

// Simple CSS bar chart — no chart library needed for 7 bars
function WeeklyActivityChart({ data }: WeeklyActivityChartProps) {
  const { t } = useTranslation();

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <Card padding="md">
      <CardTitle aside={t("dashboard.caseCount", { count: total })}>
        {t("dashboard.weeklyActivity")}
      </CardTitle>

      <div className="mt-5 flex gap-2 sm:gap-3">
        {data.map((item) => (
          <div key={item.day} className="flex min-w-0 flex-1 flex-col items-center">
            {/* Bar area (pt leaves room for the value label above the tallest bar) */}
            <div className="flex h-36 w-full items-end pt-6">
              <div
                className="relative w-full rounded-t-lg bg-brand"
                style={{ height: `${(item.count / max) * 100}%` }}
              >
                <span className="absolute inset-x-0 -top-5 text-center font-mono text-xs text-gray-600">
                  {item.count}
                </span>
              </div>
            </div>

            <span className="mt-2 font-mono text-xs uppercase tracking-wider text-gray-600">
              {t(`days.${item.day}`)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default WeeklyActivityChart;
