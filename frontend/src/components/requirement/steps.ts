import type { RequirementStatus } from "../../services/requirements";

export const STEPS = ["requirement", "scenarios", "testCases", "report"] as const;
export type Step = (typeof STEPS)[number];

// A step opens once the requirement has reached one of these statuses
const UNLOCKED_FROM: Record<Step, RequirementStatus[]> = {
  requirement: ["DRAFT", "SCENARIOS_READY", "CASES_READY", "REPORTED"],
  scenarios: ["SCENARIOS_READY", "CASES_READY", "REPORTED"],
  testCases: ["CASES_READY", "REPORTED"],
  report: ["REPORTED"],
};

// status null = a new requirement that isn't saved yet
export function isStepUnlocked(step: Step, status: RequirementStatus | null) {
  return step === "requirement" || (status !== null && UNLOCKED_FROM[step].includes(status));
}
