import { fromIssues } from "./result.js";

// Lowercase, drop punctuation and spacing — keeps letters (any language) and digits.
// Digits matter: "age 17" and "age 18" are different boundary tests.
export function normalize(value) {
  return value.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}]+/gu, "");
}

// Dice similarity of character pairs (0–1). Works for Thai too (no word spaces needed).
export function similarity(a, b) {
  const x = normalize(a);
  const y = normalize(b);

  if (x === y) {
    return 1;
  }

  if (x.length < 2 || y.length < 2) {
    return 0;
  }

  const pairs = (value) => {
    const counts = new Map();

    for (let i = 0; i < value.length - 1; i++) {
      const pair = value.slice(i, i + 2);
      counts.set(pair, (counts.get(pair) ?? 0) + 1);
    }

    return counts;
  };

  const pairsX = pairs(x);
  const pairsY = pairs(y);
  let shared = 0;

  for (const [pair, count] of pairsX) {
    shared += Math.min(count, pairsY.get(pair) ?? 0);
  }

  return (2 * shared) / (x.length - 1 + (y.length - 1));
}

const NEAR_DUPLICATE = 0.92;

function findDuplicates(items, label, getTitle, getBody) {
  const failures = [];
  const warnings = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const titleA = getTitle(items[i]);
      const titleB = getTitle(items[j]);
      const sameTitle = normalize(titleA) === normalize(titleB);
      const sameBody =
        getBody && normalize(getBody(items[i])) === normalize(getBody(items[j]));

      if (sameTitle || sameBody) {
        failures.push(`Duplicate ${label}: "${titleA}" and "${titleB}"`);
      } else if (similarity(titleA, titleB) >= NEAR_DUPLICATE) {
        warnings.push(`Possible duplicate ${label}: "${titleA}" and "${titleB}"`);
      }
    }
  }

  return { failures, warnings };
}

export function checkDuplicates(kind, output) {
  if (kind === "SCENARIOS") {
    return fromIssues(
      findDuplicates(output.scenarios, "scenario", (scenario) => scenario.title)
    );
  }

  if (kind === "TEST_CASES") {
    // Same precondition + steps + expected result = the same test, even with a
    // different title. (The precondition matters: boundary cases often differ only
    // there, e.g. "link created 29 min ago" vs "30 min ago" with identical steps.)
    return fromIssues(
      findDuplicates(
        output.testCases,
        "test case",
        (testCase) => testCase.title,
        (testCase) =>
          `${testCase.precondition}|${testCase.steps.join("|")}|${testCase.expectedResult}`
      )
    );
  }

  return fromIssues({});
}
