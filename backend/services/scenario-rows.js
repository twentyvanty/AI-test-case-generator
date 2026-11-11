// Shared by generation.service.js (drafts) and scenario.service.js (restore).
//
// A scenario run's `output` is a SNAPSHOT: the requirement's full scenario list
// right after that run ({ scenarios: [snapshot item, …] }), so any run in the
// history can be restored the same way.

// A DB scenario or an AI scenario → the shape stored in a snapshot
export function toSnapshotItem(scenario) {
  return {
    title: scenario.title,
    description: scenario.description,
    technique: scenario.technique ?? null,
    estimatedCases: scenario.estimatedCases ?? 0,
    source: scenario.source ?? "AI",
  };
}

// Snapshot items → rows for prisma.scenario.createMany, numbered from firstNumber
export function toScenarioRows(requirementId, runId, items, firstNumber = 1) {
  return items.map((item, index) => {
    const snapshot = toSnapshotItem(item);

    return {
      ...snapshot,
      requirementId,
      runId,
      number: firstNumber + index,
      position: firstNumber + index,
    };
  });
}

// The requirement's scenarios that aren't in "Recently deleted", in order
export function activeScenarios(db, requirementId) {
  return db.scenario.findMany({
    where: { requirementId, deletedAt: null },
    orderBy: { number: "asc" },
  });
}
