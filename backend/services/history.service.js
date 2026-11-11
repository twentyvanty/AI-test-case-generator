import prisma from "../prisma/client.js";
import { getOrCreateUser } from "./user.service.js";

// History → "Generated": the user's finished AI generations (scenarios and test
// cases) across all projects, newest first. FAILED runs produced nothing, and runs
// of deleted requirements are hidden with them.

export const HISTORY_KINDS = ["SCENARIOS", "TEST_CASES"];
export const DEFAULT_HISTORY_LIMIT = 50;
export const MAX_HISTORY_LIMIT = 200;

// How many items a run produced. A scenario run's output is a snapshot of the
// whole list afterwards, so for "Generate more" the kept scenarios are subtracted.
export function producedCount(run) {
  if (run.kind === "TEST_CASES") {
    return run.output?.testCases?.length ?? 0;
  }

  const total = run.output?.scenarios?.length ?? 0;
  const kept = run.input?.mode === "more" ? (run.input.existingScenarios?.length ?? 0) : 0;

  return Math.max(total - kept, 0);
}

// Test-case runs from older generations (before generationId was saved) that
// finished this close together, for the same requirement, count as one click
export const SAME_CLICK_MS = 5 * 60 * 1000;

const sameClick = (a, b) =>
  a.kind === "TEST_CASES" &&
  b.kind === "TEST_CASES" &&
  a.requirementId === b.requirementId &&
  (a.generationId || b.generationId
    ? a.generationId === b.generationId
    : Math.abs(a.createdAt - b.createdAt) <= SAME_CLICK_MS);

// Runs (newest first) → one item per click. Test cases are generated in batches,
// one run each; their runs are combined (counts added, NEEDS_REVIEW if any is).
export function groupRuns(runs) {
  const items = [];

  for (const run of runs) {
    const last = items.at(-1);

    if (last && sameClick(last.runs.at(-1), run)) {
      last.runs.push(run);
    } else {
      items.push({ runs: [run] });
    }
  }

  return items.map(({ runs: group }) => {
    const [newest] = group;
    const oldest = group.at(-1);

    return {
      id: oldest.id,
      runIds: group.map((run) => run.id).reverse(),
      kind: newest.kind,
      status: group.some((run) => run.status === "NEEDS_REVIEW") ? "NEEDS_REVIEW" : "PASSED",
      mode: newest.mode,
      itemCount: group.reduce((sum, run) => sum + run.itemCount, 0),
      createdAt: newest.createdAt,
      projectId: newest.projectId,
      projectName: newest.projectName,
      requirementNumber: newest.requirementNumber,
      requirementTitle: newest.requirementTitle,
    };
  });
}

export async function listGenerations(keycloakUser, { kind = null, limit = DEFAULT_HISTORY_LIMIT } = {}) {
  const user = await getOrCreateUser(keycloakUser);

  const runs = await prisma.generationRun.findMany({
    where: {
      kind: kind ? kind : { in: HISTORY_KINDS },
      status: { not: "FAILED" },
      requirement: { deletedAt: null, project: { userId: user.id } },
    },
    orderBy: { createdAt: "desc" },
    // A click can be several runs (batches); fetch enough to fill `limit` items
    take: limit * 6,
    select: {
      id: true,
      kind: true,
      status: true,
      createdAt: true,
      input: true,
      output: true,
      requirementId: true,
      requirement: {
        select: { number: true, title: true, project: { select: { id: true, name: true } } },
      },
    },
  });

  const flat = runs.map(({ input, output, requirement, ...run }) => ({
    ...run,
    generationId: input?.generationId ?? null,
    mode: run.kind === "SCENARIOS" ? (input?.mode === "more" ? "more" : "replace") : null,
    itemCount: producedCount({ kind: run.kind, input, output }),
    projectId: requirement.project.id,
    projectName: requirement.project.name,
    requirementNumber: requirement.number,
    requirementTitle: requirement.title,
  }));

  return groupRuns(flat).slice(0, limit);
}
