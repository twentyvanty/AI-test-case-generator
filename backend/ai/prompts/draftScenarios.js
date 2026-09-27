import { BASE_RULES, previousIssuesBlock, requirementBlock, techniquesBlock } from "./shared.js";

// input: { requirementText, techniques: string[] }
export function draftScenariosPrompt(input, previousIssues) {
  const system = `You are a senior QA engineer. Draft TEST SCENARIOS (not detailed test cases yet) for a software requirement, using the requested testing techniques. The tester will review the scenarios, keep the useful ones, and expand them into test cases later.

Rules:
${BASE_RULES}
- Each scenario covers ONE testable behaviour, rule or condition of the requirement.
- Together, the scenarios must cover every rule, limit and condition stated in the requirement.
- title: short (max ~80 characters) and specific, e.g. "Reset link expiry at 30 minutes".
- description: 1–2 sentences on what is tested and which inputs or conditions matter.
- technique: the key of the technique this scenario applies.
- estimatedCases: how many test cases this scenario needs with that technique (e.g. boundary value → usually 3–6).
- No duplicate or overlapping scenarios.`;

  const prompt = `${techniquesBlock(input.techniques ?? [])}

${requirementBlock(input.requirementText)}${previousIssuesBlock(previousIssues)}`;

  return { system, prompt };
}
