import { ProviderQuotaError, ProviderUnavailableError } from "../errors.js";
import { getTechnique } from "../techniques.js";

// Offline fake provider: used by tests, and whenever no GEMINI_API_KEY is set.
// It builds plausible output from the requirement text itself (no AI involved).
//
// MOCK_FAIL_MODE simulates problems so the retry logic can be seen:
//   never  – everything passes (default)
//   once   – the generator's 1st attempt returns malformed JSON → retried
//   always – the validator rejects every attempt → NEEDS_REVIEW
//   quota  – the generator reports a rate limit → FAILED
//   busy   – the generator's servers are "overloaded" → FAILED

export const MOCK_FAIL_MODES = ["never", "once", "always", "quota", "busy"];

const estimateTokens = (value) => Math.ceil(JSON.stringify(value ?? "").length / 4);

function sentences(text) {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim().replace(/[.!?]+$/, ""))
    .filter((part) => part.length > 3);
}

function shorten(text, max) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function numbersIn(text) {
  return [...text.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
}

// ---- technique suggestion --------------------------------------------------

function suggestTechniques(requirementText) {
  const text = requirementText.toLowerCase();
  const suggestions = [];

  if (/\d|minimum|maximum|at least|at most|between|limit|length|up to|ไม่เกิน|อย่างน้อย/.test(text)) {
    suggestions.push({
      technique: "boundaryValue",
      reason: "The requirement has numeric limits, and values around each limit are where errors usually hide.",
    });
  }

  if (/expire|status|state|lock|pending|active|log ?in|log ?out|หมดอายุ|สถานะ/.test(text)) {
    suggestions.push({
      technique: "stateTransition",
      reason: "The requirement describes things changing state over time or after events.",
    });
  }

  if ((text.match(/\b(and|or|if|unless|only)\b/g) ?? []).length >= 3) {
    suggestions.push({
      technique: "decisionTable",
      reason: "Several conditions combine to decide the outcome.",
    });
  }

  suggestions.push({
    technique: "equivalencePartitioning",
    reason: "Inputs can be grouped into valid and invalid classes that the system treats the same way.",
  });

  return { suggestions: suggestions.slice(0, 3) };
}

// ---- scenario draft ----------------------------------------------------------

const SCENARIO_PREFIX = {
  equivalencePartitioning: "Valid and invalid input",
  boundaryValue: "Boundaries",
  decisionTable: "Rule combinations",
  stateTransition: "State changes",
  syntax: "Input format",
  pairwise: "Option combinations",
  useCase: "User flow",
};

function makeScenario(technique, part) {
  const estimatedCases =
    technique === "boundaryValue"
      ? Math.min(Math.max(numbersIn(part).length * 3, 3), 6)
      : technique === "decisionTable"
        ? 4
        : technique === "stateTransition" || technique === "useCase"
          ? 3
          : technique === "syntax"
            ? 4
            : technique === "pairwise"
              ? 6
              : 2;

  return {
    title: `${SCENARIO_PREFIX[technique]}: ${shorten(part, 60)}`,
    description: `${getTechnique(technique).name} for: ${part}.`,
    technique,
    estimatedCases,
  };
}

// "Generate more": two extra scenarios, numbered after the existing ones so
// repeated "more" runs never produce the same title
function moreScenarios({ requirementText, techniques, existingScenarios }) {
  const technique = techniques?.[0] ?? "equivalencePartitioning";
  const part = shorten(sentences(requirementText)[0] ?? requirementText.trim(), 50);
  const next = existingScenarios.length + 1;

  return {
    scenarios: [
      {
        title: `Extra check ${next}: error messages for ${part}`,
        description: `Check that every rejected input for "${part}" shows a clear error message.`,
        technique,
        estimatedCases: 2,
      },
      {
        title: `Extra check ${next + 1}: repeated action for ${part}`,
        description: `Check that doing the same action twice for "${part}" doesn't create a second result.`,
        technique,
        estimatedCases: 2,
      },
    ],
  };
}

function draftScenarios({ requirementText, techniques }) {
  const chosen =
    techniques?.length > 0
      ? techniques
      : suggestTechniques(requirementText).suggestions.map((item) => item.technique);

  const parts = sentences(requirementText).slice(0, 4);

  if (parts.length === 0) {
    parts.push(shorten(requirementText.trim(), 80));
  }

  const scenarios = [];

  for (const technique of chosen) {
    for (const part of parts) {
      if (technique === "boundaryValue" && numbersIn(part).length === 0) {
        continue;
      }

      scenarios.push(makeScenario(technique, part));

      // One decision table / state model / combination table per requirement is enough
      if (technique === "decisionTable" || technique === "stateTransition" || technique === "pairwise") {
        break;
      }
    }
  }

  if (scenarios.length === 0) {
    scenarios.push(makeScenario(chosen[0], parts[0]));
  }

  return { scenarios: scenarios.slice(0, 8) };
}

// ---- test cases ------------------------------------------------------------------

function caseTemplates(technique, scenario) {
  const subject = shorten(scenario.title, 50);
  const open = `Open the feature for "${subject}"`;

  if (technique === "boundaryValue") {
    // Each limit once (the title and description often repeat the same number)
    const numbers = [...new Set(numbersIn(`${scenario.title} ${scenario.description ?? ""}`))];
    const limits = numbers.length > 0 ? numbers.slice(0, 2) : [10];

    return limits.flatMap((limit) =>
      [limit - 1, limit, limit + 1].map((value) => {
        const position = value < limit ? "just below" : value === limit ? "exactly at" : "just above";

        return {
          title: `${value} — ${position} the limit ${limit}`,
          description: `Checks the behaviour ${position} the boundary of ${limit}.`,
          precondition: "The system is running with default settings",
          steps: [open, `Use the value ${value} where the limit ${limit} applies`, "Submit the action"],
          expectedResult:
            value <= limit
              ? `The value ${value} is accepted as the requirement allows`
              : `The value ${value} is rejected with a clear message`,
        };
      })
    );
  }

  if (technique === "decisionTable") {
    return [
      ["met", "met", "is allowed"],
      ["met", "not met", "is refused"],
      ["not met", "met", "is refused"],
      ["not met", "not met", "is refused"],
    ].map(([first, second, outcome], index) => ({
      title: `Rule ${index + 1}: condition A ${first}, condition B ${second}`,
      description: `Decision table rule ${index + 1} for "${subject}".`,
      precondition: `Condition A is ${first} and condition B is ${second}`,
      steps: [open, "Perform the action covered by the rule"],
      expectedResult: `The action ${outcome}`,
    }));
  }

  if (technique === "stateTransition") {
    return [
      ["Valid transition from the starting state", "Trigger the normal event", "The system moves to the next state"],
      ["Event after the time limit", "Wait until the limit has passed, then trigger the event", "The system refuses the event and explains why"],
      ["Invalid transition is rejected", "Trigger an event that isn't allowed in the current state", "The state doesn't change and an error is shown"],
    ].map(([title, action, expected]) => ({
      title: `${title} — ${shorten(subject, 30)}`,
      description: `State transition check for "${subject}".`,
      precondition: "The item is in its starting state",
      steps: [open, action],
      expectedResult: expected,
    }));
  }

  if (technique === "syntax") {
    return [
      ["Valid format is accepted", "Enter AB123456 (2 letters + 6 digits)", "The value is accepted"],
      ["Letters part missing", "Enter 123456", "A format error is shown"],
      ["Wrong character type", "Enter AB12345X", "A format error is shown"],
      ["Too long", "Enter AB1234567", "A format error is shown"],
    ].map(([title, action, expected]) => ({
      title: `${title} — ${shorten(subject, 30)}`,
      description: `Syntax check for "${subject}".`,
      precondition: "The form is open",
      steps: [open, action, "Submit the form"],
      expectedResult: expected,
    }));
  }

  if (technique === "pairwise") {
    // 3 parameters × 2–3 values: every pair appears in at least one row
    return [
      ["Admin", "Chrome", "Card"],
      ["Admin", "Safari", "Transfer"],
      ["Member", "Chrome", "Transfer"],
      ["Member", "Safari", "Card"],
      ["Guest", "Chrome", "Card"],
      ["Guest", "Safari", "Transfer"],
    ].map(([role, browser, payment], index) => ({
      title: `Combination ${index + 1}: ${role} · ${browser} · ${payment} — ${shorten(subject, 30)}`,
      description: `Pairwise combination for "${subject}".`,
      precondition: `Logged in as ${role} on ${browser}`,
      steps: [open, `Pay with ${payment}`],
      expectedResult: "The action completes as the requirement describes",
    }));
  }

  if (technique === "useCase") {
    return [
      ["Main flow completes", "Complete every step with valid data", "The task finishes and the result is shown"],
      ["Alternative flow: user goes back and changes data", "Go back one step, change the data and continue", "The task finishes with the changed data"],
      ["Exception flow: invalid data", "Enter invalid data at the first step", "An error is shown and the flow doesn't continue"],
    ].map(([title, action, expected]) => ({
      title: `${title} — ${shorten(subject, 30)}`,
      description: `Use case check for "${subject}".`,
      precondition: "The user is logged in",
      steps: [open, action],
      expectedResult: expected,
    }));
  }

  // equivalencePartitioning
  return [
    ["Valid value is accepted", "Enter a typical valid value, e.g. tester@example.com", "The input is accepted"],
    ["Empty value is rejected", "Leave the field empty", "A required-field message is shown"],
    ["Wrongly formatted value is rejected", "Enter an invalid value, e.g. not-an-email", "A format error is shown"],
  ].map(([title, action, expected]) => ({
    title: `${title} — ${shorten(subject, 30)}`,
    description: `Equivalence partition check for "${subject}".`,
    precondition: "The form is open",
    steps: [open, action, "Submit the form"],
    expectedResult: expected,
  }));
}

function generateTestCases({ scenarios, techniques }) {
  const testCases = [];

  for (const scenario of scenarios) {
    const technique = scenario.technique ?? techniques?.[0] ?? "equivalencePartitioning";
    const count = Math.min(Math.max(scenario.estimatedCases ?? 2, 1), 6);

    for (const template of caseTemplates(technique, scenario).slice(0, count)) {
      testCases.push({ scenarioKey: scenario.key, technique, ...template });
    }
  }

  return { testCases };
}

// ---- provider ----------------------------------------------------------------------

const MALFORMED = {
  TECHNIQUE_SUGGESTION: { suggestions: [] },
  SCENARIOS: { scenarios: [{ title: "Incomplete scenario" }] },
  TEST_CASES: { testCases: [{ title: "Incomplete test case" }] },
  IMAGE_TEXT: { text: "" },
};

// Image reading: the mock can't see the image, so it returns clearly fake text
function readImage({ fileName, images }) {
  const kb = Math.round(((images?.[0]?.base64.length ?? 0) * 3) / 4 / 1024);

  return {
    text: `Mock text read from ${fileName} (${kb} KB image).\n- Users must be able to reset their password via an email link.\n- The link expires after 30 minutes.\nDiagram/screen: a "Forgot password" form with an Email field and a Send button.`,
  };
}

export function createMockProvider({ role, failMode = "never" }) {
  if (!MOCK_FAIL_MODES.includes(failMode)) {
    throw new Error(`MOCK_FAIL_MODE must be one of: ${MOCK_FAIL_MODES.join(", ")}`);
  }

  return {
    name: "mock",
    model: `mock-${role}`,

    async generateJson({ prompt, task }) {
      const { kind, input, attempt } = task;
      let data;

      if (role === "validator") {
        data =
          failMode === "always"
            ? {
                requirementCoverage: {
                  status: "fail",
                  issues: ["Mock validator: forced failure (MOCK_FAIL_MODE=always)"],
                },
                techniqueCompliance: { status: "pass", issues: [] },
                rules: { status: "pass", issues: [] },
              }
            : {
                requirementCoverage: { status: "pass", issues: [] },
                techniqueCompliance: { status: "pass", issues: [] },
                rules: { status: "pass", issues: [] },
              };
      } else if (failMode === "quota") {
        throw new ProviderQuotaError("Mock rate limit reached (MOCK_FAIL_MODE=quota)");
      } else if (failMode === "busy") {
        throw new ProviderUnavailableError("Mock servers are busy (MOCK_FAIL_MODE=busy)");
      } else if (failMode === "once" && attempt === 1) {
        data = MALFORMED[kind];
      } else if (kind === "IMAGE_TEXT") {
        data = readImage(input);
      } else if (kind === "TECHNIQUE_SUGGESTION") {
        data = suggestTechniques(input.requirementText);
      } else if (kind === "SCENARIOS") {
        data = input.existingScenarios?.length > 0 ? moreScenarios(input) : draftScenarios(input);
      } else {
        data = generateTestCases(input);
      }

      return { data, usage: { input: estimateTokens(prompt), output: estimateTokens(data) } };
    },
  };
}
