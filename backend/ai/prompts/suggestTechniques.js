import { BASE_RULES, previousIssuesBlock, requirementBlock, techniquesBlock } from "./shared.js";

// input: { requirementText }
export function suggestTechniquesPrompt(input, previousIssues) {
  const system = `You are a senior QA engineer. Recommend which black-box testing techniques best fit a software requirement.

Rules:
${BASE_RULES}
- Recommend 1 to 3 techniques, most useful first.
- For each, give a one-sentence reason that points at something specific in the requirement (a range, a rule, a state, …).`;

  const prompt = `${techniquesBlock([])}

${requirementBlock(input.requirementText)}${previousIssuesBlock(previousIssues)}`;

  return { system, prompt };
}
