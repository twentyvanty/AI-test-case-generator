import { Prisma } from "@prisma/client";

// A requirement's status follows what it has (D-029):
//   no scenarios → DRAFT · scenarios → SCENARIOS_READY · test cases → CASES_READY
// (REPORTED, once a report exists, stays while test cases exist.)
export function statusFor({ scenarios, testCases }, current) {
  if (scenarios === 0) {
    return "DRAFT";
  }

  if (testCases === 0) {
    return "SCENARIOS_READY";
  }

  return current === "REPORTED" ? "REPORTED" : "CASES_READY";
}

// Recounts inside a transaction and saves the status if it changed. Returns it.
// With no test cases left, the test-data plan is cleared too (D-035): the next
// generation starts a fresh plan.
export async function refreshStatus(tx, requirementId) {
  const [requirement, scenarios, testCases] = await Promise.all([
    tx.requirement.findUnique({
      where: { id: requirementId },
      select: { status: true, testDataPlan: true },
    }),
    tx.scenario.count({ where: { requirementId, deletedAt: null } }),
    tx.testCase.count({ where: { requirementId, deletedAt: null } }),
  ]);

  const status = statusFor({ scenarios, testCases }, requirement.status);
  const clearPlan = testCases === 0 && requirement.testDataPlan !== null;

  if (status !== requirement.status || clearPlan) {
    await tx.requirement.update({
      where: { id: requirementId },
      data: { status, ...(clearPlan && { testDataPlan: Prisma.DbNull }) },
    });
  }

  return status;
}
