import { test } from "node:test";
import assert from "node:assert/strict";
import { detectLanguage, languageBlock } from "../prompts/shared.js";
import { draftScenariosPrompt } from "../prompts/draftScenarios.js";
import { generateTestCasesPrompt } from "../prompts/generateTestCases.js";
import { suggestTechniquesPrompt } from "../prompts/suggestTechniques.js";
import { validatePrompt } from "../prompts/validate.js";

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
