// A check result: { status: "pass" | "warn" | "fail", issues: string[] }

const RANK = { pass: 0, warn: 1, fail: 2 };

export function pass() {
  return { status: "pass", issues: [] };
}

export function fromIssues({ failures = [], warnings = [] }) {
  if (failures.length > 0) {
    return { status: "fail", issues: [...failures, ...warnings] };
  }

  return warnings.length > 0 ? { status: "warn", issues: warnings } : pass();
}

// Combine several results for the same check: worst status wins, issues are joined
export function mergeResults(...results) {
  const present = results.filter(Boolean);

  return {
    status: present.reduce(
      (worst, result) => (RANK[result.status] > RANK[worst] ? result.status : worst),
      "pass"
    ),
    issues: [...new Set(present.flatMap((result) => result.issues))],
  };
}

export function countFailures(checks) {
  return Object.values(checks).filter((check) => check.status === "fail").length;
}
