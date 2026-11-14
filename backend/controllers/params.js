const LABELS = {
  projectId: "project id",
  number: "requirement number",
  scenarioNumber: "scenario number",
  testCaseNumber: "test case number",
  defectNumber: "defect number",
  imageId: "screenshot id",
  runId: "run id",
  id: "id",
};

// Reads whole-number URL params, e.g. readIds(req, res, ["projectId", "number"])
// → { projectId: 3, number: 1 }. Answers 400 and returns null if one isn't valid.
export function readIds(req, res, names) {
  const ids = {};

  for (const name of names) {
    const value = Number(req.params[name]);

    if (!Number.isInteger(value)) {
      res.status(400).json({
        message: `Invalid ${LABELS[name] ?? name}`,
      });
      return null;
    }

    ids[name] = value;
  }

  return ids;
}
