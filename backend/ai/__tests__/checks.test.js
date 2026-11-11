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

test("boundary titles that differ only in their numbers are not 'possible duplicates'", () => {
  // Seen in every real run: "4th / 5th / 6th link" and "64 / 65 characters" were flagged
  const result = checkDuplicates("SCENARIOS", {
    scenarios: [
      scenario("Request 4th password reset link within one hour"),
      scenario("Request 5th password reset link within one hour"),
      scenario("Password 64 characters with a digit"),
      scenario("Password 65 characters with a digit"),
      scenario("ขอลิงก์ครั้งที่ 5 ภายในหนึ่งชั่วโมง"),
      scenario("ขอลิงก์ครั้งที่ 6 ภายในหนึ่งชั่วโมง"),
    ],
  });

  assert.equal(result.status, "pass", JSON.stringify(result.issues));
});

test("similarity works for Thai text (no spaces between words)", () => {
  assert.equal(similarity("ลิงก์รีเซ็ตรหัสผ่านหมดอายุ", "ลิงก์รีเซ็ตรหัสผ่านหมดอายุ"), 1);
  assert.ok(similarity("ลิงก์รีเซ็ตรหัสผ่านหมดอายุ", "เข้าสู่ระบบด้วยอีเมล") < 0.5);
});

// ---- sensitive data ----

test("real-looking secrets fail", () => {
  // Fake keys, built from pieces so GitHub's secret scanner doesn't flag this file
  for (const secret of [
    "AI" + "zaSyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q",
    "sk-" + "proj-abcdefghijklmnopqrstuvwxyz123456",
    "AK" + "IAABCDEFGHIJKLMNOP",
    "-----BEGIN RSA " + "PRIVATE KEY-----",
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

// ---- generate more: duplicates against the existing scenarios ----

test("a new scenario that repeats an existing one fails", () => {
  const result = checkDuplicates(
    "SCENARIOS",
    { scenarios: [scenario("Reset link expiry!")] },
    { existing: [scenario("Reset link expiry")] }
  );

  assert.equal(result.status, "fail");
  assert.match(result.issues[0], /Reset link expiry/);
});

test("duplicates among the tester's existing scenarios are not reported", () => {
  const result = checkDuplicates(
    "SCENARIOS",
    { scenarios: [scenario("Sixth attempt is blocked")] },
    { existing: [scenario("Reset link expiry"), scenario("Reset link expiry")] }
  );

  assert.equal(result.status, "pass");
});
