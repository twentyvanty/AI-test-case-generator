import { test } from "node:test";
import assert from "node:assert/strict";
import { detectLanguage, languageBlock } from "../prompts/shared.js";
import { draftScenariosPrompt } from "../prompts/draftScenarios.js";
import { generateTestCasesPrompt } from "../prompts/generateTestCases.js";
import { suggestTechniquesPrompt } from "../prompts/suggestTechniques.js";
import { validatePrompt } from "../prompts/validate.js";
import { planTestDataPrompt } from "../prompts/planTestData.js";
import { readImagePrompt } from "../prompts/readImage.js";
import { techniquesBlock } from "../prompts/shared.js";

const thai = "นักศึกษาต้องลงทะเบียนอย่างน้อย 9 หน่วยกิต และไม่เกิน 22 หน่วยกิต";
const english = "Students must register for at least 9 and at most 22 credits.";

test("the output language is decided by the majority of letters", () => {
  assert.equal(detectLanguage(thai), "th");
  assert.equal(detectLanguage(english), "en");
  // Thai text with English product terms is still Thai
  assert.equal(detectLanguage("ระบบต้อง validate email และส่ง OTP ภายใน 3 นาที เมื่อผู้ใช้กดยืนยัน"), "th");
  // English text with one Thai name is still English
  assert.equal(detectLanguage("The user Somchai (สมชาย) must reset the password within 30 minutes."), "en");
  assert.equal(detectLanguage("1234 5678"), "en");
});

test("every prompt ends with the explicit output language", () => {
  const prompts = [
    suggestTechniquesPrompt({ requirementText: thai }, []),
    draftScenariosPrompt({ requirementText: thai, techniques: [] }, []),
    generateTestCasesPrompt(
      { requirementText: thai, techniques: [], scenarios: [{ key: "S1", title: "t", description: "d", technique: null, estimatedCases: 1 }] },
      []
    ),
    validatePrompt("SCENARIOS", { requirementText: thai, techniques: [] }, { scenarios: [] }),
  ];

  for (const { prompt } of prompts) {
    assert.ok(prompt.trimEnd().endsWith(languageBlock(thai)));
    assert.match(prompt, /OUTPUT LANGUAGE: Thai/);
  }

  assert.match(draftScenariosPrompt({ requirementText: english, techniques: [] }, []).prompt, /OUTPUT LANGUAGE: English/);
});

test("the validator is told to fail only for concrete problems", () => {
  const { system } = validatePrompt("SCENARIOS", { requirementText: english, techniques: [] }, { scenarios: [] });

  assert.match(system, /Never report something as missing if any item already includes it/);
  assert.match(system, /Gaps or vagueness in the REQUIREMENT itself are not problems of the output/);
});

test("the test-case validator judges coverage against the scenarios sent, not the whole requirement", () => {
  const input = {
    requirementText: "Users can reset a password. The link expires after 30 minutes.",
    techniques: [],
    scenarios: [{ key: "S1", title: "Link expiry", description: "d", technique: "boundaryValue", estimatedCases: 3 }],
  };

  const cases = validatePrompt("TEST_CASES", input, { testCases: [] });
  assert.match(cases.system, /for the scenarios in <scenarios> only/);
  // Extra values a scenario doesn't name are a warning, not a failure
  assert.match(cases.system, /need only the values and conditions that scenario names/);
  assert.match(cases.system, /warn at most in techniqueCompliance, never fail/);
  assert.match(cases.prompt, /S1: Link expiry/);

  const scenarios = validatePrompt("SCENARIOS", input, { scenarios: [] });
  assert.doesNotMatch(scenarios.system, /for the scenarios in <scenarios> only/);
});

test("scenarios are outlines: concrete test data is only asked for in test cases", () => {
  const input = { requirementText: english, techniques: ["useCase"] };

  // The scenario validator must not fail scenarios for missing test data
  const scenarios = validatePrompt("SCENARIOS", input, { scenarios: [] });
  assert.match(scenarios.system, /Scenarios are short outlines, not test cases/);
  assert.match(scenarios.system, /A scenario without them is not vague or untestable/);
  const cases = validatePrompt("TEST_CASES", { ...input, scenarios: [] }, { testCases: [] });
  assert.doesNotMatch(cases.system, /Scenarios are short outlines/);
  assert.match(cases.system, /steps without concrete values/);

  // The generator is told the same, and the use-case guidance splits the two levels
  const draft = draftScenariosPrompt(input, []);
  assert.match(draft.system, /Don't invent test data/);
  assert.match(draft.prompt, /Scenarios: one per flow of each use case/);
  assert.match(draft.prompt, /without made-up test data\..* Test cases: .*with concrete test data/);
});

test("invalid values come from the requirement; an assumed rule is stated, never silent", () => {
  const scenarios = [{ key: "S1", title: "Invalid code", description: "d", technique: "useCase", estimatedCases: 2 }];
  const plan = { conventions: ["Book IDs: BK- + 4 digits"], records: [] };
  const input = { requirementText: english, techniques: [], scenarios, testDataPlan: plan };

  // The generator states the assumption in the precondition (blank values need none)
  const cases = generateTestCasesPrompt(input, []);
  assert.match(cases.system, /Valid and invalid values come from the requirement/);
  assert.match(cases.system, /start the precondition with "Assumed rule \(not in the requirement\): …"/);
  assert.match(cases.system, /Blank or missing values need no assumption/);
  // The plan's naming rules are never validation rules
  assert.match(cases.system, /The conventions only name test data; they are not rules of the system/);
  assert.match(planTestDataPrompt({ requirementText: english, scenarios }, []).system, /They only name test data; they are not rules of the system/);

  // The test-case checker only warns about an unstated assumption; the scenario checker doesn't see the rule
  const check = validatePrompt("TEST_CASES", input, { testCases: [] });
  assert.match(check.system, /without "Assumed rule \(not in the requirement\): …" in its precondition → warn in rules, never fail/);
  assert.doesNotMatch(validatePrompt("SCENARIOS", input, { scenarios: [] }).system, /Assumed rule/);
});

test("a flow that can interrupt other flows (exit, cancel) names each of them", () => {
  assert.match(techniquesBlock(["useCase"]), /names every flow it can interrupt and estimates one case per flow/);

  const scenarioCheck = validatePrompt("SCENARIOS", { requirementText: english, techniques: ["useCase"] }, { scenarios: [] });
  assert.match(scenarioCheck.system, /must name every flow it can interrupt \(and, in test cases, have a case for each\)/);
});

test("prompt examples never come from the documents we test with (the models copy examples)", () => {
  const scenarios = [{ key: "S1", number: 1, title: "t", description: "d", technique: "useCase", estimatedCases: 3 }];
  const plan = { conventions: [], records: [] };
  const input = { requirementText: "x", techniques: [], scenarios, testDataPlan: plan };
  const prompts = [
    draftScenariosPrompt({ requirementText: "x", techniques: [] }, []),
    planTestDataPrompt({ requirementText: "x", scenarios }, []),
    generateTestCasesPrompt(input, []),
    validatePrompt("SCENARIOS", input, { scenarios: [] }),
    validatePrompt("TEST_CASES", input, { testCases: [] }),
    readImagePrompt({ fileName: "a.png" }, []),
  ];

  for (const { system, prompt } of prompts) {
    // The school use case of the AI Test Log (Tests 7–9)
    assert.doesNotMatch(`${system}\n${prompt}`, /school|SCH-|300 Software Testing|updat-|Contd/i);
  }
});
