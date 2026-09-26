import type { DashboardSummary, RecentRun } from "../services/dashboard";

// Placeholder data matching the design mockups.
// Delete this file once services/dashboard.ts calls the real API.

export const mockDashboardSummary: DashboardSummary = {
  totalTestCases: { value: 58, deltaVsLastWeek: 12 },
  passRate: { value: 50, deltaVsLastWeek: 6 },
  failingCases: { value: 4, deltaVsLastWeek: -1 },
  runsThisWeek: { value: 4, deltaVsLastWeek: 1 },

  weeklyActivity: [
    { day: "mon", count: 6 },
    { day: "tue", count: 11 },
    { day: "wed", count: 8 },
    { day: "thu", count: 14 },
    { day: "fri", count: 12 },
    { day: "sat", count: 3 },
    { day: "sun", count: 2 },
  ],

  techniqueMix: [
    { technique: "boundaryValue", count: 14 },
    { technique: "equivalencePartitioning", count: 11 },
    { technique: "decisionTable", count: 8 },
    { technique: "stateTransition", count: 6 },
  ],

  failingByArea: [
    { area: "Reset link validity", failCount: 2 },
    { area: "Rate limiting", failCount: 2 },
    { area: "Password strength", failCount: 1 },
  ],
};

export const mockRecentRuns: RecentRun[] = [
  { id: "GEN-2481", title: "Checkout — v2.4", caseCount: 12 },
  { id: "GEN-2479", title: "Login flow", caseCount: 22 },
  { id: "GEN-2472", title: "Search filters", caseCount: 9 },
];
