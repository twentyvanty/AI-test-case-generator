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
export async function refreshStatus(tx, requirementId) {
  const [requirement, scenarios, testCases] = await Promise.all([
    tx.requirement.findUnique({ where: { id: requirementId }, select: { status: true } }),
    tx.scenario.count({ where: { requirementId, deletedAt: null } }),
    tx.testCase.count({ where: { requirementId, deletedAt: null } }),
  ]);

  const status = statusFor({ scenarios, testCases }, requirement.status);

  if (status !== requirement.status) {
    await tx.requirement.update({ where: { id: requirementId }, data: { status } });
  }

  return status;
}
