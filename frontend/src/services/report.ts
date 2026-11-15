import { request } from "./http";
import type { DefectSeverity, DefectStatus } from "./defects";
import type { TestCaseStatus } from "./requirements";

// The test completion report (Slice 6, D-040), built by the backend from live
// data. It holds codes (NOT_RUN, CRITICAL…); the page translates them.

export type ReportCounts = { total: number; passed: number; failed: number; notRun: number };

export type VerdictReason =
  | { code: "NO_TEST_CASES" }
  | { code: "NOT_RUN"; count: number }
  | { code: "FAILED"; count: number }
  | { code: "OPEN_SERIOUS_DEFECTS"; defects: { number: number; severity: DefectSeverity }[] };

export type Verdict = { value: "READY" | "NOT_READY"; reasons: VerdictReason[] };

export type UnreviewedRun = { kind: "SCENARIOS" | "TEST_CASES"; status: string; scenarioNumbers: number[] };

export type ReportRisk =
  | { code: "FAILED_WITHOUT_DEFECT" | "NOT_RUN" | "ASSUMED_RULE"; items: number[] } // TC numbers
  | { code: "SCENARIOS_WITHOUT_CASES"; items: number[]; outOfDate: boolean } // SC numbers
  | { code: "UNREVIEWED_AI_NOTES"; items: UnreviewedRun[] };

export type ReportDefect = { number: number; title: string; severity: DefectSeverity; status: DefectStatus };

export type TestReport = {
  reportedAt: string;
  header: {
    requirementNumber: number;
    title: string;
    projectName: string;
    tester: string | null;
    techniques: string[];
    casesGeneratedAt: string | null;
  };
  summary: {
    scenarios: number;
    testCases: ReportCounts;
    passRate: number;
    executedRate: number;
    defects: { total: number; open: number; resolved: number };
    verdict: Verdict;
  };
  results: (ReportCounts & { scenarioNumber: number; title: string })[];
  traceability: {
    scenarioNumber: number;
    title: string;
    technique: string | null;
    testCases: { number: number; title: string; status: TestCaseStatus; defects: ReportDefect[] }[];
  }[];
  defects: {
    bySeverity: Record<DefectSeverity, Record<DefectStatus, number>>;
    notLinked: number;
    onDeletedCases: number;
  };
  risks: ReportRisk[];
  ai: {
    runs: number;
    attempts: number;
    passedFirstTry: number;
    needsReview: number;
    generatorModels: string[];
    validatorModels: string[];
    tokens: { input: number; output: number };
  };
};

export type ReportVersionSummary = {
  version: number;
  finalizedAt: string;
  verdict: Verdict["value"];
};

// GET …/report: the live report plus its finalizing state (used by 6d-2)
export type LiveReport = TestReport & {
  conclusion: string;
  finalized: (ReportVersionSummary & { withOpenRisks: boolean; conclusion: string }) | null;
  versions: ReportVersionSummary[];
  changedSinceFinalized: boolean;
};

const base = (projectId: number, requirementNumber: number) =>
  `/api/projects/${projectId}/requirements/${requirementNumber}/report`;

export function getReport(projectId: number, requirementNumber: number) {
  return request<LiveReport>(base(projectId, requirementNumber));
}
