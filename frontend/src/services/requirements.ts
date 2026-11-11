import type { Technique } from "./dashboard";
import { request } from "./http";

// The value is also the i18n key under "techniques.*"
export type TechniqueKey = Technique;

export const TECHNIQUE_KEYS: TechniqueKey[] = [
  "equivalencePartitioning",
  "boundaryValue",
  "decisionTable",
  "stateTransition",
];

// Which steps are unlocked: DRAFT → SCENARIOS_READY → CASES_READY → REPORTED
export type RequirementStatus = "DRAFT" | "SCENARIOS_READY" | "CASES_READY" | "REPORTED";

export type GenerationStatus = "PASSED" | "NEEDS_REVIEW" | "FAILED";

export type Requirement = {
  id: number;
  projectId: number;
  number: number; // shown as REQ-0001
  title: string;
  techniques: TechniqueKey[]; // empty = let the AI choose
  status: RequirementStatus;
  sourceFileName: string | null;
  scenarioCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Scenario = {
  id: number;
  number: number; // shown as SC-01
  title: string;
  description: string;
  technique: TechniqueKey | null;
  estimatedCases: number;
  source: "AI" | "MANUAL";
  runId: number | null;
  // Its test cases. > 0 = locked: it can't be edited, only deleted (D-029)
  testCaseCount: number;
};

// What the tester can set on a scenario (add / edit)
export type ScenarioInput = {
  title: string;
  description: string;
  technique: TechniqueKey | null;
  estimatedCases: number;
};

// The value is also the i18n key under "testCaseStatus.*"
export type TestCaseStatus = "OPEN" | "PASS" | "FAIL";

export const TEST_CASE_STATUSES: TestCaseStatus[] = ["OPEN", "PASS", "FAIL"];

export type TestCase = {
  id: number;
  number: number; // shown as TC-0001
  scenarioId: number;
  scenarioNumber: number;
  runId: number | null;
  title: string;
  description: string;
  precondition: string;
  steps: string[];
  expectedResult: string;
  technique: TechniqueKey | null;
  source: "AI" | "MANUAL";
  status: TestCaseStatus;
};

// What the tester can change on a test case (Step 3)
export type TestCaseChanges = Partial<
  Pick<TestCase, "status" | "title" | "description" | "precondition" | "steps" | "expectedResult">
>;

// One entry of the scenario draft history (last 10)
export type ScenarioRun = {
  id: number;
  createdAt: string;
  mode: DraftMode;
  status: GenerationStatus;
  attempts: number;
  scenarioCount: number;
  errorMessage: string | null;
  reviewedAt: string | null;
  restorable: boolean;
};

// "replace" = new scenarios replace the current ones; "more" = added to them
export type DraftMode = "replace" | "more";

export type CheckResult = {
  status: "pass" | "warn" | "fail";
  issues: string[];
};

// { format, requirementCoverage, techniqueCompliance, rules, … }
export type CheckResults = Record<string, CheckResult>;

export type RunSummary = {
  id: number;
  kind?: "TECHNIQUE_SUGGESTION" | "SCENARIOS" | "TEST_CASES";
  status: GenerationStatus;
  attempts: number;
  validation: { final: CheckResults | null } | null;
  errorMessage: string | null;
  // Set by "Mark as reviewed": the review note is hidden
  reviewedAt?: string | null;
  createdAt: string;
};

export type RequirementDetail = Requirement & {
  text: string;
  scenarios: Scenario[];
  testCaseCount: number;
  testCases: TestCase[];
  // The runs behind the current scenarios / test cases (their review notes)
  latestScenarioRun: RunSummary | null;
  latestCaseRun: RunSummary | null;
};

export type TechniqueSuggestion = {
  technique: TechniqueKey;
  reason: string;
};

export type SuggestionRun = RunSummary & {
  output: { suggestions: TechniqueSuggestion[] } | null;
};

export type RequirementInput = {
  title: string;
  text: string;
  techniques: TechniqueKey[];
  sourceFileName: string | null;
};

export type ExtractedDocument = {
  fileName: string;
  size: number;
  text: string;
  // "ai" = an image read by the vision model: the text needs checking
  readBy: "code" | "ai";
  // Why an image couldn't be read (AI busy, limit reached…); text is then empty
  error: string | null;
};

const base = (projectId: number) => `/api/projects/${projectId}/requirements`;

export function getRequirements(projectId: number) {
  return request<Requirement[]>(base(projectId));
}

export function getRequirement(projectId: number, number: number) {
  return request<RequirementDetail>(`${base(projectId)}/${number}`);
}

export function createRequirement(projectId: number, input: RequirementInput) {
  return request<Requirement>(base(projectId), { method: "POST", body: input });
}

export function updateRequirement(
  projectId: number,
  number: number,
  changes: Partial<RequirementInput>
) {
  return request<Requirement>(`${base(projectId)}/${number}`, {
    method: "PATCH",
    body: changes,
  });
}

export function deleteRequirement(projectId: number, number: number) {
  return request<void>(`${base(projectId)}/${number}`, { method: "DELETE" });
}

// "Suggest with AI". Can take up to a minute. A busy AI → status FAILED + errorMessage.
export function suggestTechniques(projectId: number, number: number) {
  return request<SuggestionRun>(`${base(projectId)}/${number}/technique-suggestions`, {
    method: "POST",
  });
}

// Step 1 → 2 (and Redraft / Generate more in step 2). Can take a minute or more.
// A busy AI → run.status FAILED + errorMessage, and the scenarios are unchanged.
export function draftScenarios(projectId: number, number: number, mode: DraftMode = "replace") {
  return request<{ run: RunSummary; scenarios: Scenario[] }>(
    `${base(projectId)}/${number}/scenario-drafts`,
    { method: "POST", body: { mode } }
  );
}

// ---- Step 2: scenarios ----------------------------------------------------------

const scenarioPath = (projectId: number, number: number, scenarioNumber?: number) =>
  `${base(projectId)}/${number}/scenarios${scenarioNumber === undefined ? "" : `/${scenarioNumber}`}`;

export function createScenario(projectId: number, number: number, input: ScenarioInput) {
  return request<Scenario>(scenarioPath(projectId, number), { method: "POST", body: input });
}

export function updateScenario(
  projectId: number,
  number: number,
  scenarioNumber: number,
  changes: Partial<ScenarioInput>
) {
  return request<Scenario>(scenarioPath(projectId, number, scenarioNumber), {
    method: "PATCH",
    body: changes,
  });
}

// Moves it AND its test cases to Recently deleted (7 days).
// Returns the requirement's status afterwards and how many test cases went with it.
export function deleteScenario(projectId: number, number: number, scenarioNumber: number) {
  return request<{ status: RequirementStatus; deletedTestCases: number }>(
    scenarioPath(projectId, number, scenarioNumber),
    { method: "DELETE" }
  );
}

export function getScenarioRuns(projectId: number, number: number) {
  return request<ScenarioRun[]>(`${base(projectId)}/${number}/scenario-runs`);
}

// Replaces the current scenarios with the ones saved right after that run
// (not allowed once test cases exist)
export function restoreScenarioRun(projectId: number, number: number, runId: number) {
  return request<Scenario[]>(`${base(projectId)}/${number}/scenario-runs/${runId}/restore`, {
    method: "POST",
  });
}

// "Mark as reviewed" on a scenario or test-case run that needs review
export function markRunReviewed(projectId: number, number: number, runId: number) {
  return request<{ id: number; reviewedAt: string }>(
    `${base(projectId)}/${number}/runs/${runId}/reviewed`,
    { method: "POST" }
  );
}

// ---- Step 3: test cases -----------------------------------------------------------

const testCasePath = (projectId: number, number: number, testCaseNumber?: number) =>
  `${base(projectId)}/${number}/test-cases${testCaseNumber === undefined ? "" : `/${testCaseNumber}`}`;

// Test cases for the scenarios that don't have any yet, in small batches (two at a
// time). Can take several minutes. `run` = the first FAILED batch if any (its
// errorMessage says why), else the last one; batches that passed keep their cases.
export function draftTestCases(projectId: number, number: number) {
  return request<{
    run: RunSummary;
    runs: (RunSummary & { input?: { scenarioNumbers?: number[] } })[];
    testCases: TestCase[];
  }>(
    `${base(projectId)}/${number}/test-case-drafts`,
    { method: "POST" }
  );
}

export function updateTestCase(
  projectId: number,
  number: number,
  testCaseNumber: number,
  changes: TestCaseChanges
) {
  return request<TestCase>(testCasePath(projectId, number, testCaseNumber), {
    method: "PATCH",
    body: changes,
  });
}

// Moves it to Recently deleted (7 days). Returns the requirement's status afterwards.
export function deleteTestCase(projectId: number, number: number, testCaseNumber: number) {
  return request<{ status: RequirementStatus }>(testCasePath(projectId, number, testCaseNumber), {
    method: "DELETE",
  });
}

// Reads the text out of PDF / DOCX / Markdown / TXT files (nothing is stored)
export function extractText(files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));

  return request<ExtractedDocument[]>("/api/documents/extract-text", {
    method: "POST",
    body: form,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// 1 → "REQ-0001"
export function formatRequirementCode(number: number) {
  return `REQ-${String(number).padStart(4, "0")}`;
}

// 1 → "SC-01"
export function formatScenarioCode(number: number) {
  return `SC-${String(number).padStart(2, "0")}`;
}

// 1 → "TC-0001"
export function formatTestCaseCode(number: number) {
  return `TC-${String(number).padStart(4, "0")}`;
}

export type IssueGroup = "coverage" | "technique" | "other";

// The "needs review" issues grouped by the check that raised them:
// coverage → "Missing from your scenarios", technique → "Technique not applied
// correctly", anything else (rules, format…) → "Other things to check"
export function groupIssues(checks: CheckResults | null | undefined) {
  const groups: Record<IssueGroup, string[]> = { coverage: [], technique: [], other: [] };

  for (const [name, check] of Object.entries(checks ?? {})) {
    if (check.status === "pass") {
      continue;
    }

    const group: IssueGroup =
      name === "requirementCoverage" ? "coverage" : name === "techniqueCompliance" ? "technique" : "other";
    groups[group].push(...check.issues);
  }

  return groups;
}

// A review note is shown for a NEEDS_REVIEW run until the tester marks it reviewed
export function needsReview(run: RunSummary | null | undefined): run is RunSummary {
  return run?.status === "NEEDS_REVIEW" && !run.reviewedAt;
}

// A PASSED run can still carry warnings (e.g. a doubtful value the validator
// noticed): shown as collapsed "AI notes to check" until marked reviewed
export function hasAiNotes(run: RunSummary | null | undefined): run is RunSummary {
  return (
    run?.status === "PASSED" &&
    !run.reviewedAt &&
    Object.values(run.validation?.final ?? {}).some((check) => check.status === "warn")
  );
}

// Mirrors the backend's batching (services/test-case-rows.js): at most 8
// estimated cases per AI request, two requests at a time, about 2 minutes each
const MAX_CASES_PER_BATCH = 8;
const PARALLEL_BATCHES = 2;

// Roughly how long generating test cases for these scenarios takes, in minutes
export function estimateCaseMinutes(estimates: number[]) {
  let batches = 0;
  let cases = 0;

  for (const estimate of estimates.map((value) => value || 3)) {
    if (batches === 0 || cases + estimate > MAX_CASES_PER_BATCH) {
      batches += 1;
      cases = 0;
    }

    cases += estimate;
  }

  return { batches, minutes: Math.max(1, Math.ceil(batches / PARALLEL_BATCHES) * 2) };
}
