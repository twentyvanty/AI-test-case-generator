import prisma from "../prisma/client.js";
import { resolveDefectDates, toDefectItem, todayIso, fromIsoDate, toIsoDate } from "./defect-rows.js";
import { BadRequestError } from "./errors.js";
import { findOwnedRequirement } from "./requirement.service.js";

// Defects (Slice 6, under the Step 3 table). Addressed by their number inside
// the requirement (DEF-1 = 1). null = requirement or defect not found (or not
// the user's).

const withTestCase = { testCase: { select: { number: true, deletedAt: true } } };

const formatTestCaseCode = (number) => `TC-${String(number).padStart(4, "0")}`;

// Active defects, in DEF order, as the API returns them
export function activeDefects(db, requirementId) {
  return db.defect
    .findMany({
      where: { requirementId, deletedAt: null },
      orderBy: { number: "asc" },
      include: withTestCase,
    })
    .then((defects) => defects.map(toDefectItem));
}

export function defectCount(db, requirementId) {
  return db.defect.count({ where: { requirementId, deletedAt: null } });
}

function findActiveDefect(requirementId, number) {
  return prisma.defect.findFirst({ where: { requirementId, number, deletedAt: null } });
}

// testCaseNumber → the test case id to store. undefined = not sent (no change),
// null = no link. A new link must point at an active test case of this requirement.
async function linkedTestCaseId(requirementId, testCaseNumber) {
  if (testCaseNumber === undefined || testCaseNumber === null) {
    return testCaseNumber;
  }

  const testCase = await prisma.testCase.findFirst({
    where: { requirementId, number: testCaseNumber, deletedAt: null },
    select: { id: true },
  });

  if (!testCase) {
    throw new BadRequestError(`Test case ${formatTestCaseCode(testCaseNumber)} isn't in this requirement`);
  }

  return testCase.id;
}

function datesOrThrow(current, data) {
  const dates = resolveDefectDates(current, data, todayIso());

  if (dates.error) {
    throw new BadRequestError(dates.error);
  }

  return dates;
}

export async function getDefects(keycloakUser, projectId, requirementNumber) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);

  return requirement ? activeDefects(prisma, requirement.id) : null;
}

// Numbered after the requirement's highest DEF number, deleted ones included, so
// numbers are never reused. Two requests at the same moment could pick the same
// number; the unique (requirementId, number) index rejects one, so retry it.
export async function createDefect(keycloakUser, projectId, requirementNumber, data) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);

  if (!requirement) {
    return null;
  }

  const testCaseId = await linkedTestCaseId(requirement.id, data.testCaseNumber);
  const dates = datesOrThrow(null, data);

  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const { _max } = await tx.defect.aggregate({
          where: { requirementId: requirement.id },
          _max: { number: true },
        });

        const defect = await tx.defect.create({
          data: {
            requirementId: requirement.id,
            testCaseId: testCaseId ?? null,
            number: (_max.number ?? 0) + 1,
            title: data.title.trim(),
            severity: data.severity,
            priority: data.priority,
            status: dates.status,
            openedOn: fromIsoDate(dates.openedOn),
            closedOn: fromIsoDate(dates.closedOn),
            notes: data.notes?.trim() ?? "",
          },
          include: withTestCase,
        });

        return toDefectItem(defect);
      });
    } catch (error) {
      if (error.code !== "P2002" || attempt >= 3) {
        throw error;
      }
    }
  }
}

// Any field; only the ones sent change
export async function updateDefect(keycloakUser, projectId, requirementNumber, number, data) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);
  const defect = requirement && (await findActiveDefect(requirement.id, number));

  if (!defect) {
    return null;
  }

  const testCaseId = await linkedTestCaseId(requirement.id, data.testCaseNumber);
  const current = {
    status: defect.status,
    openedOn: toIsoDate(defect.openedOn),
    closedOn: toIsoDate(defect.closedOn),
  };
  const dates = datesOrThrow(current, data);

  const updated = await prisma.defect.update({
    where: { id: defect.id },
    data: {
      testCaseId,
      title: data.title?.trim(),
      severity: data.severity,
      priority: data.priority,
      notes: data.notes?.trim(),
      status: dates.status,
      openedOn: fromIsoDate(dates.openedOn),
      closedOn: fromIsoDate(dates.closedOn),
    },
    include: withTestCase,
  });

  return toDefectItem(updated);
}

// Moves a defect to "Recently deleted" (7 days). true = done, null = not found.
export async function deleteDefect(keycloakUser, projectId, requirementNumber, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, requirementNumber);
  const defect = requirement && (await findActiveDefect(requirement.id, number));

  if (!defect) {
    return null;
  }

  await prisma.defect.update({ where: { id: defect.id }, data: { deletedAt: new Date() } });
  return true;
}
