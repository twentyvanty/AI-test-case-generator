import prisma from "../prisma/client.js";
import { getOrCreateUser } from "./user.service.js";
import { daysLeft, purgeCutoff, purgeDate } from "./trash-dates.js";

// "Recently deleted": deleting a requirement or scenario only sets its deletedAt.
// For 7 days the user can restore it here (children come back with it), then
// purgeExpired() removes it for good.
//
// Types: "requirement" and "scenario" (test cases join in Slice 5).

export const TRASH_TYPES = ["requirement", "scenario"];

function entry(type, item, extra) {
  return {
    type,
    id: item.id,
    title: item.title,
    deletedAt: item.deletedAt,
    purgeAt: purgeDate(item.deletedAt),
    daysLeft: daysLeft(item.deletedAt),
    ...extra,
  };
}

// The user's deleted items, most recently deleted first. A deleted scenario of a
// deleted requirement isn't listed separately — it comes back with the requirement.
export async function listDeleted(keycloakUser) {
  const user = await getOrCreateUser(keycloakUser);

  const [requirements, scenarios] = await Promise.all([
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
        requirement: {
          select: { number: true, title: true, project: { select: { id: true, name: true } } },
        },
      },
    }),
  ]);

  return [
    ...requirements.map((item) =>
      entry("requirement", item, {
        projectId: item.project.id,
        projectName: item.project.name,
        requirementNumber: item.number,
        requirementTitle: item.title,
        scenarioNumber: null,
      })
    ),
    ...scenarios.map((item) =>
      entry("scenario", item, {
        projectId: item.requirement.project.id,
        projectName: item.requirement.project.name,
        requirementNumber: item.requirement.number,
        requirementTitle: item.requirement.title,
        scenarioNumber: item.number,
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

  return prisma.scenario.findFirst({
    where: {
      id,
      deletedAt: { not: null },
      requirement: { deletedAt: null, project: { userId: user.id } },
    },
    include: { requirement: { select: { projectId: true, number: true, status: true } } },
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

    return { type, projectId: item.projectId, requirementNumber: item.number, scenarioNumber: null };
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

    // It may have been the requirement's last scenario
    if (item.requirement.status === "DRAFT") {
      await tx.requirement.update({
        where: { id: item.requirementId },
        data: { status: "SCENARIOS_READY" },
      });
    }

    return {
      type,
      projectId: item.requirement.projectId,
      requirementNumber: item.requirement.number,
      scenarioNumber: number,
    };
  });
}

// Removes a deleted item for good right away. false = not found.
export async function deleteForever(keycloakUser, type, id) {
  const item = await findDeleted(keycloakUser, type, id);

  if (!item) {
    return false;
  }

  // The database cascades to runs / scenarios / test cases
  await prisma[type].delete({ where: { id } });

  return true;
}

// Removes everything deleted more than 7 days ago. Runs at start-up and hourly.
export async function purgeExpired(now = new Date()) {
  const where = { deletedAt: { lt: purgeCutoff(now) } };

  const [testCases, scenarios, requirements] = await prisma.$transaction([
    prisma.testCase.deleteMany({ where }),
    prisma.scenario.deleteMany({ where }),
    prisma.requirement.deleteMany({ where }),
  ]);

  return {
    testCases: testCases.count,
    scenarios: scenarios.count,
    requirements: requirements.count,
  };
}
