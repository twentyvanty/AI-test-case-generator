import type { RequirementStatus } from "../../services/requirements";

export const STEPS = ["requirement", "scenarios", "testCases", "testScripts", "report"] as const;
export type Step = (typeof STEPS)[number];

const WITH_CASES: RequirementStatus[] = ["CASES_READY", "REPORTED"];

// A step opens once the requirement has reached one of these statuses
const UNLOCKED_FROM: Record<Step, RequirementStatus[]> = {
  requirement: ["DRAFT", "SCENARIOS_READY", "CASES_READY", "REPORTED"],
  scenarios: ["SCENARIOS_READY", "CASES_READY", "REPORTED"],
  testCases: WITH_CASES,
  testScripts: WITH_CASES,
  report: WITH_CASES,
};

// status null = a new requirement that isn't saved yet
export function isStepUnlocked(step: Step, status: RequirementStatus | null) {
  return step === "requirement" || (status !== null && UNLOCKED_FROM[step].includes(status));
}
