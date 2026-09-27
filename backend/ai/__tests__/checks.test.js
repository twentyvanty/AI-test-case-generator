import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDuplicates, similarity } from "../checks/duplicates.js";
import { checkSensitiveData } from "../checks/sensitiveData.js";
import { mergeResults } from "../checks/result.js";

const scenario = (title) => ({ title, description: "d", technique: "boundaryValue", estimatedCases: 3 });

const testCase = (title, steps, expectedResult = "Accepted") => ({
  scenarioKey: "S1",
  title,
  description: "d",
  precondition: "",
  steps,
  expectedResult,
  technique: "boundaryValue",
});

// ---- duplicates ----

test("exact duplicate scenario titles fail (ignoring case and punctuation)", () => {
  const result = checkDuplicates("SCENARIOS", {
    scenarios: [scenario("Reset link expiry"), scenario("reset link  expiry!")],
  });

  assert.equal(result.status, "fail");
});

test("boundary cases that differ only by a number are NOT duplicates", () => {
  const result = checkDuplicates("TEST_CASES", {
    testCases: [
      testCase("Age 17 is rejected", ["Enter 17 in Age"], "Rejected"),
      testCase("Age 18 is accepted", ["Enter 18 in Age"], "Accepted"),
    ],
  });

  assert.equal(result.status, "pass");
});

test("test cases with identical steps and result fail even with different titles", () => {
  const result = checkDuplicates("TEST_CASES", {
    testCases: [
      testCase("Valid email", ["Enter a@example.com", "Submit"]),
      testCase("Correct email address", ["Enter a@example.com", "Submit"]),
    ],
  });

  assert.equal(result.status, "fail");
});

test("cases with the same steps but different preconditions are NOT duplicates", () => {
  const withPrecondition = (title, precondition) => ({
    ...testCase(title, ["Click the reset link"], "Accepted"),
    precondition,
  });

  const result = checkDuplicates("TEST_CASES", {
    testCases: [
      withPrecondition("Link used at 29:59", "The link was created 29 min 59 s ago"),
      withPrecondition("Link used at 30:00", "The link was created exactly 30 min ago"),
    ],
  });

  assert.equal(result.status, "pass");
});

test("near-duplicate titles only warn", () => {
  const result = checkDuplicates("SCENARIOS", {
    scenarios: [scenario("Password reset link expires"), scenario("Password reset link expired")],
  });

  assert.equal(result.status, "warn");
});

test("similarity works for Thai text (no spaces between words)", () => {
  assert.equal(similarity("ลิงก์รีเซ็ตรหัสผ่านหมดอายุ", "ลิงก์รีเซ็ตรหัสผ่านหมดอายุ"), 1);
  assert.ok(similarity("ลิงก์รีเซ็ตรหัสผ่านหมดอายุ", "เข้าสู่ระบบด้วยอีเมล") < 0.5);
});

// ---- sensitive data ----

test("real-looking secrets fail", () => {
  for (const secret of [
    "AIzaSyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q",
    "sk-proj-abcdefghijklmnopqrstuvwxyz123456",
    "AKIAABCDEFGHIJKLMNOP",
    "-----BEGIN RSA PRIVATE KEY-----",
  ]) {
    const result = checkSensitiveData({ steps: [`Use ${secret}`] });
    assert.equal(result.status, "fail", secret);
  }
});

test("safe test data passes: example.com emails and published test cards", () => {
  const result = checkSensitiveData({
    steps: ["Enter tester@example.com", "Pay with 4111 1111 1111 1111", "Enter password Test@1234"],
  });

  assert.equal(result.status, "pass");
});

test("real-looking emails and card numbers warn", () => {
  const email = checkSensitiveData({ steps: ["Enter somchai@gmail.com"] });
  assert.equal(email.status, "warn");

  // Luhn-valid, not a published test card
  const card = checkSensitiveData({ steps: ["Pay with 4539 1488 0343 6467"] });
  assert.equal(card.status, "warn");
});

test("a valid-checksum Thai national ID warns", () => {
  // 1-1017-00230-70-8 → checksum digit 8 is valid
  const result = checkSensitiveData({ steps: ["Enter ID 1101700230708"] });
  assert.equal(result.status, "warn");
});

// ---- merging ----

test("merging results keeps the worst status and all issues", () => {
  const merged = mergeResults(
    { status: "warn", issues: ["a"] },
    { status: "fail", issues: ["b"] },
    { status: "pass", issues: [] }
  );

  assert.deepEqual(merged, { status: "fail", issues: ["a", "b"] });
});
