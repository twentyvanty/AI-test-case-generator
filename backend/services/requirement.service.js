import prisma from "../prisma/client.js";
import { activeTestCases, scenariosWithCounts } from "./test-case.service.js";
import { getOrCreateUser } from "./user.service.js";

// Requirements are addressed by project id + requirement number (REQ-0001 = number 1).
// Every query also checks project.userId, so users only ever reach their own data.
// Deleted rows (deletedAt set) wait in "Recently deleted" (trash.service.js) and are
// skipped by every query here.

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
  _count: { select: { scenarios: { where: { deletedAt: null } } } },
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
      deletedAt: null,
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
    where: { projectId, deletedAt: null },
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

  // Next number in this project, counting deleted ones too so numbers are never
  // reused. Two requests at the same moment could pick the same number; the unique
  // (projectId, number) index rejects one, so retry it.
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

const runFields = {
  id: true,
  kind: true,
  status: true,
  attempts: true,
  validation: true,
  errorMessage: true,
  reviewedAt: true,
  createdAt: true,
};

// The newest run that produced any of these items (their "needs review" note
// belongs to what's on screen, not to a later run that failed)
function latestRunOf(items) {
  const runIds = items.map((item) => item.runId).filter((id) => id !== null);

  return runIds.length > 0
    ? prisma.generationRun.findUnique({ where: { id: Math.max(...runIds) }, select: runFields })
    : null;
}

// Every run that produced any of these items, oldest first. Test cases come from
// several runs (one per batch), and each run's review notes belong on screen.
function runsOf(items) {
  const runIds = [...new Set(items.map((item) => item.runId).filter((id) => id !== null))];

  return runIds.length > 0
    ? prisma.generationRun.findMany({
        where: { id: { in: runIds } },
        orderBy: { id: "asc" },
        select: runFields,
      })
    : [];
}

// The requirement with its scenarios (each with testCaseCount), its test cases,
// and the runs behind the current scenarios and test cases
export async function getRequirement(keycloakUser, projectId, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return null;
  }

  const [scenarios, testCases] = await Promise.all([
    scenariosWithCounts(prisma, requirement.id),
    activeTestCases(prisma, requirement.id),
  ]);
  const [latestScenarioRun, latestCaseRun, caseRuns, defectCount] = await Promise.all([
    latestRunOf(scenarios),
    latestRunOf(testCases),
    runsOf(testCases),
    // Active defects (Slice 6); the list itself comes from GET …/defects
    prisma.defect.count({ where: { requirementId: requirement.id, deletedAt: null } }),
  ]);

  return {
    ...requirement,
    scenarioCount: scenarios.length,
    testCaseCount: testCases.length,
    defectCount,
    scenarios,
    testCases,
    latestScenarioRun,
    latestCaseRun,
    caseRuns,
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

// Moves the requirement to "Recently deleted" (restorable for 7 days, together with
// its runs, scenarios and test cases). false = not found (or not the user's).
export async function deleteRequirement(keycloakUser, projectId, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return false;
  }

  await prisma.requirement.update({
    where: { id: requirement.id },
    data: { deletedAt: new Date() },
  });

  return true;
}
