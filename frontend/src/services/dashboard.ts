import { mockDashboardSummary, mockRecentRuns } from "../mocks/dashboard";

// Testing techniques — the value is also the i18n key under "techniques.*"
export type Technique =
  | "boundaryValue"
  | "equivalencePartitioning"
  | "decisionTable"
  | "stateTransition";

// The value is also the i18n key under "days.*"
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type StatMetric = {
  value: number;
  deltaVsLastWeek: number;
};

export type DashboardSummary = {
  totalTestCases: StatMetric;
  passRate: StatMetric; // percent, 0–100
  failingCases: StatMetric;
  runsThisWeek: StatMetric;
  weeklyActivity: { day: Weekday; count: number }[];
  techniqueMix: { technique: Technique; count: number }[];
  failingByArea: { area: string; failCount: number }[];
};

export type RecentRun = {
  id: string;
  title: string;
  caseCount: number;
};

// TODO: replace the mock data with real API calls once the backend has
// generation runs and test cases, e.g.
//   const response = await fetch(`${API_URL}/api/dashboard/summary`, { headers });
// Pages only depend on these functions, so nothing else needs to change.

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return mockDashboardSummary;
}

export async function getRecentRuns(): Promise<RecentRun[]> {
  return mockRecentRuns;
}
