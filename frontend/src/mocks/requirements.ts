import {
  allCases,
  nextId,
  type GenerateOptions,
  type Requirement,
  type Scenario,
  type TestCase,
} from "../services/requirements";

// In-memory fake backend for requirements, scenarios and test cases.
// Changes survive page navigation but are lost on reload.
// Delete this file once services/requirements.ts calls the real API.

const GENERATION_DELAY_MS = 1200;

type CaseSeed = Omit<TestCase, "id">;

function makeScenarios(
  seeds: { title: string; cases: CaseSeed[] }[],
  firstCaseNumber: number,
  firstScenarioNumber = 1
): Scenario[] {
  let caseNumber = firstCaseNumber;

  return seeds.map((seed, index) => ({
    id: `SC-${String(firstScenarioNumber + index).padStart(2, "0")}`,
    title: seed.title,
    cases: seed.cases.map((item) => ({
      ...item,
      id: `TC-${String(caseNumber++).padStart(4, "0")}`,
    })),
  }));
}

const passwordResetScenarios = [
  {
    title: "Request a reset link",
    cases: [
      {
        title: "Valid email receives reset link",
        precondition: "A registered account exists and the user is signed out",
        steps: [
          "Open the sign-in page",
          "Click 'Forgot password'",
          "Enter the registered email",
          "Submit the form",
        ],
        expectedResult: "Reset email is delivered within 1 minute",
        status: "pass" as const,
      },
      {
        title: "Empty email field blocked",
        precondition: "The reset form is open",
        steps: ["Leave the email field blank", "Submit the form"],
        expectedResult: "Required-field error is shown inline",
        status: "open" as const,
      },
    ],
  },
  {
    title: "Reset link validity",
    cases: [
      {
        title: "Link used within 30 minutes",
        precondition: "A reset link was issued less than 30 minutes ago",
        steps: [
          "Open the reset link",
          "Enter a new valid password",
          "Confirm the password",
        ],
        expectedResult: "Password is updated and user is redirected home",
        status: "pass" as const,
      },
      {
        title: "Link used after 30 minutes",
        precondition: "A reset link older than 30 minutes exists",
        steps: ["Open the expired reset link"],
        expectedResult: "Token expired message with a re-request option",
        status: "fail" as const,
      },
    ],
  },
  {
    title: "Rate limiting",
    cases: [
      {
        title: "Fifth attempt within an hour is allowed",
        precondition: "The user has made 4 failed attempts in the last hour",
        steps: ["Request a reset link again", "Enter an incorrect code"],
        expectedResult: "The attempt is processed normally",
        status: "fail" as const,
      },
      {
        title: "Sixth attempt within an hour is blocked",
        precondition: "The user has made 5 failed attempts in the last hour",
        steps: ["Request a reset link again"],
        expectedResult: "A 'too many attempts' message is shown",
        status: "open" as const,
      },
    ],
  },
];

const cardPaymentScenarios = [
  {
    title: "Card number validation",
    cases: [
      {
        title: "Valid card number is accepted",
        precondition: "The checkout payment form is open",
        steps: ["Enter a valid 16-digit card number", "Submit the payment"],
        expectedResult: "Payment proceeds to confirmation",
        status: "pass" as const,
      },
      {
        title: "Card number with 15 digits is rejected",
        precondition: "The checkout payment form is open",
        steps: ["Enter a 15-digit card number", "Submit the payment"],
        expectedResult: "An 'invalid card number' error is shown",
        status: "pass" as const,
      },
    ],
  },
  {
    title: "Expiry date",
    cases: [
      {
        title: "Expired card is rejected",
        precondition: "The checkout payment form is open",
        steps: ["Enter an expiry date in the past", "Submit the payment"],
        expectedResult: "A 'card expired' error is shown",
        status: "open" as const,
      },
    ],
  },
];

// Generic output used when "generating" for requirements without seed data
const genericScenarios = [
  {
    title: "Valid input is accepted",
    cases: [
      {
        title: "Submit with valid data",
        precondition: "The form is open",
        steps: ["Fill in all required fields with valid values", "Submit the form"],
        expectedResult: "The request succeeds and a confirmation is shown",
        status: "open" as const,
      },
    ],
  },
  {
    title: "Invalid input is rejected",
    cases: [
      {
        title: "Required field left empty",
        precondition: "The form is open",
        steps: ["Leave a required field blank", "Submit the form"],
        expectedResult: "An inline validation error is shown",
        status: "open" as const,
      },
      {
        title: "Value outside the allowed range",
        precondition: "The form is open",
        steps: ["Enter a value just outside the allowed range", "Submit the form"],
        expectedResult: "The value is rejected with a clear message",
        status: "open" as const,
      },
    ],
  },
];

const extraScenario = {
  title: "Boundary values",
  cases: [
    {
      title: "Value exactly at the lower limit",
      precondition: "The form is open",
      steps: ["Enter the minimum allowed value", "Submit the form"],
      expectedResult: "The value is accepted",
      status: "open" as const,
    },
    {
      title: "Value exactly at the upper limit",
      precondition: "The form is open",
      steps: ["Enter the maximum allowed value", "Submit the form"],
      expectedResult: "The value is accepted",
      status: "open" as const,
    },
  ],
};

function createSeedRequirements(projectId: number): Requirement[] {
  return [
    {
      id: "REQ-0042",
      projectId,
      title: "Password reset by email",
      text: "Users must be able to reset their password via email link. The link expires after 30 minutes. Failed attempts are capped at 5 per hour.",
      status: "success",
      techniques: ["boundaryValue", "aiChoose"],
      aiModule: "local",
      scenarios: makeScenarios(passwordResetScenarios, 421),
    },
    {
      id: "REQ-0043",
      projectId,
      title: "Card payment validation",
      text: "The checkout must validate card number length, expiry date and CVV before sending the payment to the provider.",
      status: "success",
      techniques: ["equivalencePartitioning"],
      aiModule: "cloud",
      scenarios: makeScenarios(cardPaymentScenarios, 431),
    },
    {
      id: "REQ-0044",
      projectId,
      title: "Order cancellation rules",
      text: "Customers can cancel an order until it has been shipped. Cancelled orders are refunded within 5 business days.",
      status: "notGenerated",
      techniques: ["aiChoose"],
      aiModule: "auto",
      scenarios: [],
    },
  ];
}

const store = new Map<number, Requirement[]>();

function getStore(projectId: number) {
  if (!store.has(projectId)) {
    store.set(projectId, createSeedRequirements(projectId));
  }

  return store.get(projectId)!;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockGetRequirements(projectId: number) {
  return structuredClone(getStore(projectId));
}

export async function mockSaveRequirement(requirement: Requirement) {
  const requirements = getStore(requirement.projectId);
  const index = requirements.findIndex((item) => item.id === requirement.id);

  if (index === -1) {
    requirements.push(structuredClone(requirement));
  } else {
    requirements[index] = structuredClone(requirement);
  }

  return structuredClone(requirement);
}

// Next free test case number across the whole project
function nextCaseNumber(projectId: number) {
  const ids = getStore(projectId).flatMap((item) =>
    allCases(item.scenarios).map((testCase) => testCase.id)
  );

  return Number(nextId("TC-", ids, 4).slice(3));
}

export async function mockGenerateScenarios(
  requirement: Requirement,
  options: GenerateOptions
) {
  await wait(GENERATION_DELAY_MS);

  const seeds =
    requirement.id === "REQ-0042"
      ? passwordResetScenarios
      : requirement.id === "REQ-0043"
        ? cardPaymentScenarios
        : genericScenarios;

  // Freshly generated cases haven't been run yet
  const openSeeds = seeds.map((seed) => ({
    ...seed,
    cases: seed.cases.map((item) => ({ ...item, status: "open" as const })),
  }));

  const updated: Requirement = {
    ...requirement,
    ...options,
    status: "success",
    scenarios: makeScenarios(openSeeds, nextCaseNumber(requirement.projectId)),
  };

  return mockSaveRequirement(updated);
}

export async function mockGenerateMore(requirement: Requirement) {
  await wait(GENERATION_DELAY_MS);

  const [scenario] = makeScenarios(
    [extraScenario],
    nextCaseNumber(requirement.projectId),
    requirement.scenarios.length + 1
  );

  const updated: Requirement = {
    ...requirement,
    scenarios: [
      ...requirement.scenarios,
      { ...scenario, id: nextId("SC-", requirement.scenarios.map((item) => item.id), 2) },
    ],
  };

  return mockSaveRequirement(updated);
}
