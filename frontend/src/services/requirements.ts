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
  selected: boolean;
  estimatedCases: number;
  source: "AI" | "MANUAL";
};

export type CheckResult = {
  status: "pass" | "warn" | "fail";
  issues: string[];
};

// { format, requirementCoverage, techniqueCompliance, rules, … }
export type CheckResults = Record<string, CheckResult>;

export type RunSummary = {
  id: number;
  status: GenerationStatus;
  attempts: number;
  validation: { final: CheckResults | null } | null;
  errorMessage: string | null;
  createdAt: string;
};

export type RequirementDetail = Requirement & {
  text: string;
  scenarios: Scenario[];
  latestScenarioRun: RunSummary | null;
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

// Step 1 → 2. Can take a minute or more. A busy AI → run.status FAILED + errorMessage.
export function draftScenarios(projectId: number, number: number) {
  return request<{ run: RunSummary; scenarios: Scenario[] }>(
    `${base(projectId)}/${number}/scenario-drafts`,
    { method: "POST" }
  );
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

// Every issue from failed or warning checks, e.g. for the "needs review" note
export function issuesOf(checks: CheckResults | null | undefined) {
  return Object.values(checks ?? {}).flatMap((check) =>
    check.status === "pass" ? [] : check.issues
  );
}
