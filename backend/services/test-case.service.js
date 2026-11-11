import prisma from "../prisma/client.js";
import { findOwnedRequirement } from "./requirement.service.js";
import { refreshStatus } from "./requirement-status.js";
import { activeScenarios } from "./scenario-rows.js";
import { toCountMap } from "./test-case-rows.js";

// Step 3: the requirement's test cases. Test cases are addressed by their number
// (TC-0001 = 1) inside the requirement. null = requirement or test case not found
// (or not the user's).

// Active test cases with their scenario's number, in TC order
export function activeTestCases(db, requirementId) {
  return db.testCase
    .findMany({
      where: { requirementId, deletedAt: null },
      orderBy: { number: "asc" },
      include: { scenario: { select: { number: true } } },
    })
    .then((testCases) =>
      testCases.map(({ scenario, ...testCase }) => ({ ...testCase, scenarioNumber: scenario.number }))
    );
}

// true once any scenario of the requirement has test cases: the scenario list
// can't be replaced any more (D-029)
export async function hasTestCases(db, requirementId) {
  return (await db.testCase.count({ where: { requirementId, deletedAt: null } })) > 0;
}

// Map scenarioId → number of active test cases
export async function testCaseCounts(db, requirementId) {
  const groups = await db.testCase.groupBy({
    by: ["scenarioId"],
    where: { requirementId, deletedAt: null },
    _count: { _all: true },
  });

  return toCountMap(groups);
}

// Active scenarios, each with testCaseCount (> 0 = locked, D-029)
export async function scenariosWithCounts(db, requirementId) {
  const [scenarios, counts] = await Promise.all([
    activeScenarios(db, requirementId),
    testCaseCounts(db, requirementId),
  ]);

  return scenarios.map((scenario) => ({ ...scenario, testCaseCount: counts.get(scenario.id) ?? 0 }));
}

function findActiveTestCase(requirementId, number) {
  return prisma.testCase.findFirst({ where: { requirementId, number, deletedAt: null } });
}

export async function getTestCases(keycloakUser, projectId, requirementNumber) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);

  return requirement ? activeTestCases(prisma, requirement.id) : null;
}

// Status (Open / Pass / Fail) or the tester's edits to the text
export async function updateTestCase(keycloakUser, projectId, requirementNumber, number, data) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);
  const testCase = requirement && (await findActiveTestCase(requirement.id, number));

  if (!testCase) {
    return null;
  }

  const trimmed = (value) => (typeof value === "string" ? value.trim() : undefined);

  const updated = await prisma.testCase.update({
    where: { id: testCase.id },
    data: {
      status: data.status,
      title: trimmed(data.title),
      description: trimmed(data.description),
      precondition: trimmed(data.precondition),
      steps: data.steps?.map((step) => step.trim()),
      expectedResult: trimmed(data.expectedResult),
    },
    include: { scenario: { select: { number: true } } },
  });

  const { scenario, ...rest } = updated;
  return { ...rest, scenarioNumber: scenario.number };
}

// Moves one test case to "Recently deleted". When its scenario has no cases left,
// that scenario unlocks again (D-029). Returns the requirement's new status.
export async function deleteTestCase(keycloakUser, projectId, requirementNumber, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);
  const testCase = requirement && (await findActiveTestCase(requirement.id, number));

  if (!testCase) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    await tx.testCase.update({
      where: { id: testCase.id },
      data: { deletedAt: new Date(), deletedWithScenario: false },
    });

    return { status: await refreshStatus(tx, requirement.id) };
  });
}
