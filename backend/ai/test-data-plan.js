// Keeps a requirement's test-data plan add-only (D-035): cases generated earlier
// use the existing records, so they are never renamed, changed or dropped, even
// if the AI returns them differently. Returns the merged plan.
export function mergeTestDataPlans(existing, added) {
  if (!existing) {
    return added;
  }

  const known = (list, value) => list.some((item) => item.toLowerCase() === value.toLowerCase());
  const conventions = [...existing.conventions];

  for (const convention of added.conventions) {
    if (!known(conventions, convention)) {
      conventions.push(convention);
    }
  }

  const records = [...existing.records];

  for (const record of added.records) {
    if (!known(records.map((item) => item.id), record.id)) {
      records.push(record);
    }
  }

  return { conventions, records };
}

// The plan the test-case batches get after a planning run: the merged plan when
// the run PASSED, else the existing plan (or null). A plan that failed its checks
// (e.g. a real-looking secret) is never used, and a failed planning step never
// blocks test cases (D-035).
export function nextTestDataPlan(existing, result) {
  return result?.status === "PASSED" && result.output
    ? mergeTestDataPlans(existing, result.output)
    : (existing ?? null);
}
