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
  // Added 2026-11-12 after a review of which techniques fit text-only requirements and
  // manual test cases (cause-effect graphing, random testing and experience-based
  // techniques are under discussion with the team)
  {
    key: "syntax",
    name: "Syntax testing",
    description:
      "Test inputs that must follow a defined format (email, phone, date, ID code, password rules) with valid forms and with each format rule broken.",
    guidance:
      "Use ONLY when the requirement defines an input format (e.g. an email, phone number, date, ID or code pattern, password composition, file name). For each format: one case with a fully valid value, then one case per format element that breaks only that element (missing, extra, wrong character type, wrong length, wrong order or separator). Put the exact input strings in the steps. Don't use it when no format is defined.",
  },
  {
    key: "pairwise",
    name: "Combinatorial (pairwise) testing",
    description:
      "When several independent parameters each have a few values, test a small set of combinations in which every pair of values appears together at least once.",
    guidance:
      "Use ONLY when the outcome depends on two or more independent parameters (e.g. role, device, browser, payment method, plan, language), each with a few values. Name the parameters and their values in the scenario description. Choose a small set of test cases (usually 6–12) in which every pair of values of any two parameters appears together in at least one case, and state the full combination of values in each case's precondition or steps.",
  },
  {
    key: "useCase",
    name: "Use case (scenario-based) testing",
    description:
      "Follow whole user tasks from start to end: the main flow, alternative flows and error or exception flows.",
    guidance:
      "Use when the requirement describes a user task, user story or flow of steps. For each use case, test the main (happy) flow end to end, each alternative flow, and the important exception flows (e.g. invalid data, cancel, timeout, a step that fails). Each test case follows the flow step by step from its start state to the visible end result, with concrete data.",
  },
];

export const TECHNIQUE_KEYS = TECHNIQUES.map((technique) => technique.key);

export function getTechnique(key) {
  return TECHNIQUES.find((technique) => technique.key === key);
}
