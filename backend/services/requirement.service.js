import prisma from "../prisma/client.js";
import { getOrCreateUser } from "./user.service.js";

// Requirements are addressed by project id + requirement number (REQ-0001 = number 1).
// Every query also checks project.userId, so users only ever reach their own data.

const listFields = {
  id: true,
  projectId: true,
  number: true,
  title: true,
  techniques: true,
  status: true,
  sourceFileName: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { scenarios: true } },
};

// Prisma's `_count` → a plain `scenarioCount` field
function toListItem({ _count, ...requirement }) {
  return {
    ...requirement,
    scenarioCount: _count.scenarios,
  };
}

async function findOwnedProject(keycloakUser, projectId) {
  const user = await getOrCreateUser(keycloakUser);

  return prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
    select: { id: true },
  });
}

// The requirement, or null if it doesn't exist or isn't the user's.
// Also used by generation.service.js.
export async function findOwnedRequirement(keycloakUser, projectId, number) {
  const user = await getOrCreateUser(keycloakUser);

  return prisma.requirement.findFirst({
    where: {
      projectId,
      number,
      project: { userId: user.id },
    },
  });
}

// null = project not found (or not the user's)
export async function getRequirements(keycloakUser, projectId) {
  const project = await findOwnedProject(keycloakUser, projectId);

  if (!project) {
    return null;
  }

  const requirements = await prisma.requirement.findMany({
    where: { projectId },
    select: listFields,
    orderBy: { number: "asc" },
  });

  return requirements.map(toListItem);
}

// null = project not found (or not the user's)
export async function createRequirement(keycloakUser, projectId, data) {
  const project = await findOwnedProject(keycloakUser, projectId);

  if (!project) {
    return null;
  }

  // Next number in this project. Two requests at the same moment could pick the
  // same number; the unique (projectId, number) index rejects one, so retry it.
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const { _max } = await tx.requirement.aggregate({
          where: { projectId },
          _max: { number: true },
        });

        const requirement = await tx.requirement.create({
          data: {
            projectId,
            number: (_max.number ?? 0) + 1,
            title: data.title.trim(),
            text: data.text.trim(),
            techniques: data.techniques ?? [],
            sourceFileName: data.sourceFileName ?? null,
          },
          select: listFields,
        });

        return toListItem(requirement);
      });
    } catch (error) {
      if (error.code !== "P2002" || attempt >= 3) {
        throw error;
      }
    }
  }
}

// The requirement with its scenarios and the latest scenario draft run
export async function getRequirement(keycloakUser, projectId, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return null;
  }

  const [scenarios, latestScenarioRun] = await Promise.all([
    prisma.scenario.findMany({
      where: { requirementId: requirement.id },
      orderBy: { number: "asc" },
    }),
    prisma.generationRun.findFirst({
      where: { requirementId: requirement.id, kind: "SCENARIOS" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        attempts: true,
        validation: true,
        errorMessage: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    ...requirement,
    scenarioCount: scenarios.length,
    scenarios,
    latestScenarioRun,
  };
}

// null = not found (or not the user's)
export async function updateRequirement(keycloakUser, projectId, number, data) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return null;
  }

  const updated = await prisma.requirement.update({
    where: { id: requirement.id },
    data: {
      title: data.title?.trim(),
      text: data.text?.trim(),
      techniques: data.techniques,
      sourceFileName: data.sourceFileName,
    },
    select: listFields,
  });

  return toListItem(updated);
}

// false = not found (or not the user's). Runs, scenarios and cases are deleted with it.
export async function deleteRequirement(keycloakUser, projectId, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return false;
  }

  await prisma.requirement.delete({ where: { id: requirement.id } });

  return true;
}
