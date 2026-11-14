import prisma from "../prisma/client.js";
import { refreshStatus } from "./requirement-status.js";
import { getOrCreateUser } from "./user.service.js";
import { daysLeft, purgeCutoff, purgeDate } from "./trash-dates.js";
import { sweepOrphanImages } from "./defect-image-store.js";

// "Recently deleted": deleting a requirement, scenario, test case or defect only sets its
// deletedAt. For 7 days the user can restore it here (children come back with it),
// then purgeExpired() removes it for good.
//
// A scenario deleted with its test cases is ONE entry ("SC-03 + 5 test cases");
// those cases (deletedWithScenario) aren't listed separately and come back with it.

export const TRASH_TYPES = ["requirement", "scenario", "testCase", "defect"];

function entry(type, item, extra) {
  return {
    type,
    id: item.id,
    title: item.title,
    deletedAt: item.deletedAt,
    purgeAt: purgeDate(item.deletedAt),
    daysLeft: daysLeft(item.deletedAt),
    defectNumber: null,
    ...extra,
  };
}

// The user's deleted items, most recently deleted first. Children of a deleted
// parent aren't listed separately — they come back with the parent.
export async function listDeleted(keycloakUser) {
  const user = await getOrCreateUser(keycloakUser);
  const requirementInfo = {
    select: { number: true, title: true, project: { select: { id: true, name: true } } },
  };

  const [requirements, scenarios, testCases, defects] = await Promise.all([
    prisma.requirement.findMany({
      where: { deletedAt: { not: null }, project: { userId: user.id } },
      include: { project: { select: { id: true, name: true } } },
    }),
    prisma.scenario.findMany({
      where: {
        deletedAt: { not: null },
        requirement: { deletedAt: null, project: { userId: user.id } },
      },
      include: {
        requirement: requirementInfo,
        _count: { select: { testCases: { where: { deletedWithScenario: true } } } },
      },
    }),
    prisma.testCase.findMany({
      where: {
        deletedAt: { not: null },
        deletedWithScenario: false,
        scenario: { deletedAt: null },
        requirement: { deletedAt: null, project: { userId: user.id } },
      },
      include: {
        requirement: requirementInfo,
        scenario: { select: { number: true } },
      },
    }),
    prisma.defect.findMany({
      where: {
        deletedAt: { not: null },
        requirement: { deletedAt: null, project: { userId: user.id } },
      },
      include: { requirement: requirementInfo },
    }),
  ]);

  const where = (item) => ({
    projectId: item.requirement.project.id,
    projectName: item.requirement.project.name,
    requirementNumber: item.requirement.number,
    requirementTitle: item.requirement.title,
  });

  return [
    ...requirements.map((item) =>
      entry("requirement", item, {
        projectId: item.project.id,
        projectName: item.project.name,
        requirementNumber: item.number,
        requirementTitle: item.title,
        scenarioNumber: null,
        testCaseNumber: null,
        testCaseCount: 0,
      })
    ),
    ...scenarios.map((item) =>
      entry("scenario", item, {
        ...where(item),
        scenarioNumber: item.number,
        testCaseNumber: null,
        // Test cases deleted together with it, restored together with it
        testCaseCount: item._count.testCases,
      })
    ),
    ...testCases.map((item) =>
      entry("testCase", item, {
        ...where(item),
        scenarioNumber: item.scenario.number,
        testCaseNumber: item.number,
        testCaseCount: 0,
      })
    ),
    ...defects.map((item) =>
      entry("defect", item, {
        ...where(item),
        scenarioNumber: null,
        testCaseNumber: null,
        testCaseCount: 0,
        defectNumber: item.number,
      })
    ),
  ].sort((a, b) => b.deletedAt - a.deletedAt);
}

// A deleted item of this user, or null
async function findDeleted(keycloakUser, type, id) {
  const user = await getOrCreateUser(keycloakUser);

  if (type === "requirement") {
    return prisma.requirement.findFirst({
      where: { id, deletedAt: { not: null }, project: { userId: user.id } },
    });
  }

  const owned = { deletedAt: null, project: { userId: user.id } };
  const requirement = { select: { projectId: true, number: true } };

  if (type === "defect") {
    return prisma.defect.findFirst({
      where: { id, deletedAt: { not: null }, requirement: owned },
      include: { requirement },
    });
  }

  if (type === "testCase") {
    return prisma.testCase.findFirst({
      where: {
        id,
        deletedAt: { not: null },
        deletedWithScenario: false,
        scenario: { deletedAt: null },
        requirement: owned,
      },
      include: { requirement, scenario: { select: { number: true } } },
    });
  }

  return prisma.scenario.findFirst({
    where: { id, deletedAt: { not: null }, requirement: owned },
    include: { requirement },
  });
}

// Brings an item back. Returns where it lives now (for a link), or null if not found.
export async function restoreDeleted(keycloakUser, type, id) {
  const item = await findDeleted(keycloakUser, type, id);

  if (!item) {
    return null;
  }

  if (type === "requirement") {
    await prisma.requirement.update({ where: { id }, data: { deletedAt: null } });

    return {
      type,
      projectId: item.projectId,
      requirementNumber: item.number,
      scenarioNumber: null,
      testCaseNumber: null,
      defectNumber: null,
    };
  }

  if (type === "defect") {
    // DEF numbers are never reused, so it keeps its number
    await prisma.defect.update({ where: { id }, data: { deletedAt: null } });

    return {
      type,
      projectId: item.requirement.projectId,
      requirementNumber: item.requirement.number,
      scenarioNumber: null,
      testCaseNumber: null,
      defectNumber: item.number,
    };
  }

  if (type === "testCase") {
    // TC numbers are never reused while a case waits here (new cases count deleted
    // ones too), so it keeps its number
    return prisma.$transaction(async (tx) => {
      await tx.testCase.update({ where: { id }, data: { deletedAt: null } });
      await refreshStatus(tx, item.requirementId);

      return {
        type,
        projectId: item.requirement.projectId,
        requirementNumber: item.requirement.number,
        scenarioNumber: item.scenario.number,
        testCaseNumber: item.number,
        defectNumber: null,
      };
    });
  }

  return prisma.$transaction(async (tx) => {
    // Its number may have been taken meanwhile (e.g. by a redraft) → next free one
    const taken = await tx.scenario.findFirst({
      where: { requirementId: item.requirementId, number: item.number, deletedAt: null },
    });
    let number = item.number;

    if (taken) {
      const { _max } = await tx.scenario.aggregate({
        where: { requirementId: item.requirementId, deletedAt: null },
        _max: { number: true },
      });
      number = (_max.number ?? 0) + 1;
    }

    await tx.scenario.update({
      where: { id },
      data: { deletedAt: null, number, position: number },
    });

    // The test cases deleted together with it come back too
    await tx.testCase.updateMany({
      where: { scenarioId: id, deletedWithScenario: true },
      data: { deletedAt: null, deletedWithScenario: false },
    });

    // It may have been the requirement's last scenario, or brought test cases back
    await refreshStatus(tx, item.requirementId);

    return {
      type,
      projectId: item.requirement.projectId,
      requirementNumber: item.requirement.number,
      scenarioNumber: number,
      testCaseNumber: null,
      defectNumber: null,
    };
  });
}

// Removes a deleted item for good right away. false = not found.
export async function deleteForever(keycloakUser, type, id) {
  const item = await findDeleted(keycloakUser, type, id);

  if (!item) {
    return false;
  }

  // The database cascades to runs / scenarios / test cases / defects; the
  // screenshot files of defects that went with it are removed here (D-037)
  await prisma[type].delete({ where: { id } });
  await sweepImagesSafely();

  return true;
}

// Removes everything deleted more than 7 days ago. Runs at start-up and hourly.
export async function purgeExpired(now = new Date()) {
  const where = { deletedAt: { lt: purgeCutoff(now) } };

  const [defects, testCases, scenarios, requirements] = await prisma.$transaction([
    prisma.defect.deleteMany({ where }),
    prisma.testCase.deleteMany({ where }),
    prisma.scenario.deleteMany({ where }),
    prisma.requirement.deleteMany({ where }),
  ]);

  const images = await sweepImagesSafely();

  return {
    defects: defects.count,
    imageFolders: images.folders,
    testCases: testCases.count,
    scenarios: scenarios.count,
    requirements: requirements.count,
  };
}

// File clean-up never fails the delete itself: a leftover file is removed by the
// next sweep (every purge, hourly)
async function sweepImagesSafely() {
  try {
    return await sweepOrphanImages(prisma);
  } catch (error) {
    console.error("Clean-up of defect screenshot files failed:", error);
    return { folders: 0, files: 0 };
  }
}
