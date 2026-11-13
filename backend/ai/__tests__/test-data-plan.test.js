import { test } from "node:test";
import assert from "node:assert/strict";
import { generateTestCases, mergeTestDataPlans, nextTestDataPlan, planTestData, PLAN_MAX_ATTEMPTS } from "../index.js";
import { createMockProvider } from "../providers/mock.provider.js";
import { generateTestCasesPrompt } from "../prompts/generateTestCases.js";
import { planTestDataPrompt } from "../prompts/planTestData.js";
import { validatePrompt } from "../prompts/validate.js";

// One test-data plan shared by every test-case batch (D-035)

const requirementText =
  "Admins manage schools: add a school with a unique code, view, edit and delete it. A school with students can't be deleted.";

const scenarios = [
  { title: "Add a new school", description: "Main flow of adding a school", technique: "useCase" },
  { title: "Delete a school", description: "Main and exception flows of deleting", technique: "useCase" },
];

const plan = {
  conventions: ["School codes: SCH- + 3 digits", "Records a test case sets up itself: SCH-T<scenario number>-<case position>"],
  records: [
    { id: "SCH-001", type: "School", details: "Green Valley School, 120 students", state: "exists" },
    { id: "SCH-999", type: "School", details: "Never created", state: "doesNotExist" },
  ],
};

const mock = () => ({
  generator: createMockProvider({ role: "generator" }),
  validator: createMockProvider({ role: "validator" }),
});

// A generator that always returns the same answer
const answering = (data) => ({
  generator: { model: "fixed", generateJson: async () => ({ data, usage: { input: 1, output: 1 } }) },
  validator: { model: "unused", generateJson: async () => assert.fail("the plan has no AI validator") },
});

test("the plan is one call with no AI validator, and passes with the mock", async () => {
  const result = await planTestData({ requirementText, scenarios }, mock());

  assert.equal(result.kind, "TEST_DATA_PLAN");
  assert.equal(result.status, "PASSED");
  assert.equal(result.attempts, 1);
  assert.equal(result.validatorModel, "none");
  assert.ok(result.output.records.length > 0);
  // The sensitive-data check runs, as the records go into every test case
  assert.deepEqual(Object.keys(result.validation.final), ["format", "rules"]);
});

test("a plan with a real-looking secret or a repeated record id is rejected", async () => {
  const secret = await planTestData(
    { requirementText, scenarios },
    answering({ ...plan, conventions: ["Admin API key: AIzaSyA1234567890abcdefghijklmnopqrstuv"] })
  );
  // After 3 attempts the draft is kept for the log, but never handed to the batches
  assert.equal(secret.status, "NEEDS_REVIEW");
  assert.match(JSON.stringify(secret.validation.attempts[0].checks.rules), /Google API key/);
  assert.equal(nextTestDataPlan(null, secret), null);
  assert.equal(nextTestDataPlan(plan, secret), plan);

  const repeated = await planTestData(
    { requirementText, scenarios },
    answering({ ...plan, records: [plan.records[0], { ...plan.records[0], id: "sch-001" }] })
  );
  assert.equal(repeated.status, "NEEDS_REVIEW");
  assert.equal(nextTestDataPlan(null, repeated), null);
  assert.match(JSON.stringify(repeated.validation.attempts[0].checks.format), /listed twice/);
});

test("the plan only grows: existing records and conventions are never changed or dropped", () => {
  const added = {
    conventions: ["school codes: sch- + 3 digits", "Emails: <name>@example.com"],
    records: [
      { ...plan.records[0], details: "Renamed by the AI" },
      { id: "SCH-002", type: "School", details: "River Side School, no students", state: "exists" },
    ],
  };
  const merged = mergeTestDataPlans(plan, added);

  assert.deepEqual(merged.conventions, [...plan.conventions, "Emails: <name>@example.com"]);
  assert.deepEqual(merged.records.map((record) => record.id), ["SCH-001", "SCH-999", "SCH-002"]);
  assert.equal(merged.records[0].details, "Green Valley School, 120 students");
  assert.equal(mergeTestDataPlans(null, added), added);
});

test("a failed planning step keeps the existing plan (or none), so test cases still run", () => {
  assert.equal(nextTestDataPlan(plan, { status: "FAILED", output: null }), plan);
  assert.equal(nextTestDataPlan(null, { status: "FAILED", output: null }), null);
  assert.equal(nextTestDataPlan(null, undefined), null);
  assert.equal(nextTestDataPlan(null, { status: "NEEDS_REVIEW", output: plan }), null);
  assert.deepEqual(nextTestDataPlan(null, { status: "PASSED", output: plan }), plan);
});

test("planning again for new scenarios sends the existing plan and asks to keep it", () => {
  const first = planTestDataPrompt({ requirementText, scenarios }, []);
  assert.doesNotMatch(first.prompt, /<existing_plan>/);
  assert.match(first.system, /Every test case may READ it, none may change or delete it/);

  const again = planTestDataPrompt({ requirementText, scenarios, existingPlan: plan }, []);
  assert.match(again.prompt, /<existing_plan>[\s\S]*SCH-001/);
  assert.match(again.system, /keep every existing convention and record exactly as it is/);
});

test("every test-case batch gets the plan and the read-only rules", async () => {
  const input = {
    requirementText,
    techniques: [],
    scenarios: [{ key: "S1", number: 3, title: "Delete a school", description: "d", technique: "useCase", estimatedCases: 3 }],
    testDataPlan: plan,
  };

  const { system, prompt } = generateTestCasesPrompt(input, []);
  assert.match(prompt, /S1: Delete a school \(scenario no\. 3\)/);
  assert.match(prompt, /<test_data_plan>[\s\S]*SCH-001 \(School, exists\)[\s\S]*SCH-999 \(School, does not exist\)/);
  assert.match(system, /Shared records are read-only/);
  assert.match(system, /sets up its OWN record in its precondition/);

  // Without a plan (planning failed) the prompt is as before
  const without = generateTestCasesPrompt({ ...input, testDataPlan: undefined }, []);
  assert.doesNotMatch(without.prompt, /<test_data_plan>/);
  assert.doesNotMatch(without.system, /Shared records are read-only/);

  // The plan reaches the AI through the public function
  const result = await generateTestCases(input, mock());
  assert.equal(result.status, "PASSED");
});

test("the validator checks cases against the plan, but only warns", () => {
  const input = {
    requirementText,
    techniques: [],
    scenarios: [{ key: "S1", title: "Delete a school", description: "d", technique: "useCase", estimatedCases: 3 }],
    testDataPlan: plan,
  };

  const cases = validatePrompt("TEST_CASES", input, { testCases: [] });
  assert.match(cases.prompt, /<test_data_plan>/);
  assert.match(cases.system, /adds, edits or deletes a shared record[\s\S]*→ warn in rules, never fail/);

  const scenariosCheck = validatePrompt("SCENARIOS", input, { scenarios: [] });
  assert.doesNotMatch(scenariosCheck.prompt, /<test_data_plan>/);
  assert.doesNotMatch(scenariosCheck.system, /<test_data_plan>\. A case/);
});

test("the plan gets at most 2 tries (the batches wait for it, and run fine without it)", async () => {
  let calls = 0;
  const broken = {
    generator: { model: "fixed", generateJson: async () => (calls++, { data: { records: [{}] }, usage: { input: 1, output: 1 } }) },
    validator: { model: "unused", generateJson: async () => assert.fail("no validator") },
  };

  const result = await planTestData({ requirementText, scenarios }, broken);

  assert.equal(PLAN_MAX_ATTEMPTS, 2);
  assert.equal(calls, 2);
  assert.equal(result.attempts, 2);
  assert.equal(result.status, "FAILED");
  assert.equal(nextTestDataPlan(null, result), null);
});
