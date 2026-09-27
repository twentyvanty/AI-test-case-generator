// Testing techniques the AI can use.
// To add one: add an entry here + its name in frontend/src/i18n/locales/{en,th}.ts
// (key under "techniques"). No database change is needed.

export const TECHNIQUES = [
  {
    key: "equivalencePartitioning",
    name: "Equivalence partitioning",
    description:
      "Split inputs into groups (partitions) that the system should treat the same way, then test one representative value from each valid and invalid partition.",
    guidance:
      "Identify every input and its valid and invalid partitions. Create one scenario per input or rule, and one test case per partition (at least one valid and one invalid). Use a clearly representative value from the middle of each partition.",
  },
  {
    key: "boundaryValue",
    name: "Boundary value analysis",
    description:
      "Test values at the edges of valid ranges, where off-by-one errors happen.",
    guidance:
      "For every range, limit, length, count or time limit in the requirement, test the value just below the boundary, exactly on it, and just above it (for both minimum and maximum where they exist). Put the exact boundary values in the test steps.",
  },
  {
    key: "decisionTable",
    name: "Decision table",
    description:
      "Test combinations of conditions that lead to different outcomes (business rules).",
    guidance:
      "List the conditions and the resulting actions. Create one test case per meaningful combination of conditions (rule column), and say in each case which conditions are true or false.",
  },
  {
    key: "stateTransition",
    name: "State transition",
    description:
      "Test how the system moves between states (e.g. pending → active → expired) and that invalid transitions are blocked.",
    guidance:
      "Identify the states, events and transitions. Test every valid transition at least once, and the important invalid transitions (events that must be rejected in a given state).",
  },
];

export const TECHNIQUE_KEYS = TECHNIQUES.map((technique) => technique.key);

export function getTechnique(key) {
  return TECHNIQUES.find((technique) => technique.key === key);
}
