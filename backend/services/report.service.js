import prisma from "../prisma/client.js";
import { activeDefects } from "./defect.service.js";
import { buildReport } from "./report-builder.js";
import { findOwnedRequirement } from "./requirement.service.js";
import { activeScenarios } from "./scenario-rows.js";
import { activeTestCases } from "./test-case.service.js";

// The live test completion report (Slice 6c, D-040). Loads the requirement's
// data; the rules are in report-builder.js. null = requirement not found (or
// not the user's).

const runFields = {
  id: true,
  kind: true,
  status: true,
  attempts: true,
  generatorModel: true,
  validatorModel: true,
  usage: true,
  validation: true,
  reviewedAt: true,
  createdAt: true,
  input: true,
};

// The AI runs behind the current scenarios and test cases, plus the test-data
// plan runs of the same clicks (their tokens count too)
async function runsBehind(requirementId, scenarios, testCases) {
  const runIds = [...new Set([...scenarios, ...testCases].map((item) => item.runId).filter((id) => id !== null))];

  if (runIds.length === 0) {
    return [];
  }

  const runs = await prisma.generationRun.findMany({
    where: { id: { in: runIds } },
    orderBy: { id: "asc" },
    select: runFields,
  });
  const generationIds = new Set(runs.map((run) => run.input?.generationId).filter(Boolean));
  const plans =
    generationIds.size > 0
      ? (
          await prisma.generationRun.findMany({
            where: { requirementId, kind: "TEST_DATA_PLAN" },
            orderBy: { id: "asc" },
            select: runFields,
          })
        ).filter((run) => generationIds.has(run.input?.generationId))
      : [];

  return [...runs, ...plans];
}

export async function getReport(keycloakUser, projectId, number) {
  const requirement = await findOwnedRequirement(keycloakUser, projectId, number);

  if (!requirement) {
    return null;
  }

  const [project, scenarios, testCases, defects] = await Promise.all([
    prisma.project.findUnique({ where: { id: requirement.projectId }, include: { user: true } }),
    activeScenarios(prisma, requirement.id),
    activeTestCases(prisma, requirement.id),
    activeDefects(prisma, requirement.id),
  ]);

  return buildReport({
    requirement,
    projectName: project.name,
    tester: project.user.name ?? project.user.email ?? null,
    scenarios,
    testCases,
    defects,
    runs: await runsBehind(requirement.id, scenarios, testCases),
  });
}
