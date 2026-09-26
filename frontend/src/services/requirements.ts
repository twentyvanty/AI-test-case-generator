import type { Technique } from "./dashboard";
import {
  mockGenerateMore,
  mockGenerateScenarios,
  mockGetRequirements,
  mockSaveRequirement,
} from "../mocks/requirements";

export type TestCaseStatus = "pass" | "fail" | "open";

export type TestCase = {
  id: string; // e.g. "TC-0421"
  title: string;
  precondition: string;
  steps: string[];
  expectedResult: string;
  status: TestCaseStatus;
};

export type Scenario = {
  id: string; // e.g. "SC-01"
  title: string;
  cases: TestCase[];
};

// "aiChoose" lets the AI pick the technique
export type TechniqueChoice = Technique | "aiChoose";

// The value is also the i18n key under "aiModules.*"
export type AiModule = "local" | "cloud" | "auto";

export type GenerationStatus = "notGenerated" | "success";

export type Requirement = {
  id: string; // e.g. "REQ-0042"
  projectId: number;
  title: string;
  text: string;
  status: GenerationStatus;
  techniques: TechniqueChoice[];
  aiModule: AiModule;
  scenarios: Scenario[];
};

export type GenerateOptions = {
  text: string;
  techniques: TechniqueChoice[];
  aiModule: AiModule;
};

// ---------------------------------------------------------------------------
// TODO: replace the mock calls with real API requests once the backend has
// requirement / scenario / test case tables. Pages only use these functions.
// ---------------------------------------------------------------------------

export async function getRequirements(projectId: number): Promise<Requirement[]> {
  return mockGetRequirements(projectId);
}

export async function getRequirement(
  projectId: number,
  requirementId: string
): Promise<Requirement | null> {
  const requirements = await getRequirements(projectId);

  return requirements.find((item) => item.id === requirementId) ?? null;
}

export async function addRequirement(
  projectId: number,
  text: string
): Promise<Requirement> {
  const requirements = await getRequirements(projectId);
  const trimmed = text.trim();

  const requirement: Requirement = {
    id: nextId("REQ-", requirements.map((item) => item.id), 4),
    projectId,
    // Use the first sentence (max 80 chars) as the title
    title: trimmed.split(/[.\n]/)[0].slice(0, 80),
    text: trimmed,
    status: "notGenerated",
    techniques: ["aiChoose"],
    aiModule: "auto",
    scenarios: [],
  };

  return mockSaveRequirement(requirement);
}

export async function saveRequirement(requirement: Requirement): Promise<Requirement> {
  return mockSaveRequirement(requirement);
}

// Asks the AI to generate scenarios + test cases (replaces existing ones)
export async function generateScenarios(
  requirement: Requirement,
  options: GenerateOptions
): Promise<Requirement> {
  return mockGenerateScenarios(requirement, options);
}

// Asks the AI for extra scenarios, keeping the existing ones
export async function generateMoreScenarios(
  requirement: Requirement
): Promise<Requirement> {
  return mockGenerateMore(requirement);
}

// ---------------------------------------------------------------------------
// Helpers (pure functions — these stay when the mocks are removed)
// ---------------------------------------------------------------------------

// nextId("SC-", ["SC-01", "SC-02"], 2) → "SC-03"
export function nextId(prefix: string, existingIds: string[], padding: number) {
  const numbers = existingIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter((value) => Number.isFinite(value));

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

  return `${prefix}${String(next).padStart(padding, "0")}`;
}

export function allCases(scenarios: Scenario[]): TestCase[] {
  return scenarios.flatMap((scenario) => scenario.cases);
}

export type CoverageArea = {
  key: string;
  label: string;
  passed: number;
  total: number;
};

export type CoverageSummary = {
  percent: number; // passed cases / all cases, 0–100
  areas: CoverageArea[]; // one per scenario
  passedCases: number;
  failingCases: number;
  mappedCases: number;
};

export function summarizeCoverage(scenarios: Scenario[]): CoverageSummary {
  const cases = allCases(scenarios);
  const passedCases = cases.filter((item) => item.status === "pass").length;

  return {
    percent: cases.length > 0 ? Math.round((passedCases / cases.length) * 100) : 0,
    areas: scenarios
      .filter((scenario) => scenario.cases.length > 0)
      .map((scenario) => ({
        key: scenario.id,
        label: scenario.title,
        passed: scenario.cases.filter((item) => item.status === "pass").length,
        total: scenario.cases.length,
      })),
    passedCases,
    failingCases: cases.filter((item) => item.status === "fail").length,
    mappedCases: cases.length,
  };
}
