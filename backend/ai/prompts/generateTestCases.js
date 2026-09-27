import { BASE_RULES, previousIssuesBlock, requirementBlock, techniquesBlock } from "./shared.js";

export function scenariosBlock(scenarios) {
  return `<scenarios>\n${scenarios
    .map(
      (scenario) =>
        `${scenario.key}: ${scenario.title}\n  technique: ${scenario.technique ?? "any"}\n  about ${scenario.estimatedCases ?? 3} test cases\n  ${scenario.description ?? ""}`.trimEnd()
    )
    .join("\n")}\n</scenarios>`;
}

// input: { requirementText, techniques: string[], scenarios: [{ key, title, description, technique, estimatedCases }] }
export function generateTestCasesPrompt(input, previousIssues) {
  const system = `You are a senior QA engineer. Expand the selected test scenarios into detailed, executable TEST CASES for a software requirement.

Rules:
${BASE_RULES}
- Write test cases for EVERY scenario, roughly the number of cases each scenario asks for. Set scenarioKey to the scenario's key (S1, S2, …).
- title: short and specific (what makes this case different from its siblings).
- description: one sentence on the purpose of the case.
- precondition: the state the system/data must be in before the steps (use "" if none).
- steps: concrete actions a manual tester can follow, one action per step, with exact test values (e.g. "Enter 17 in the Age field").
- expectedResult: the observable outcome that decides pass/fail.
- technique: normally the scenario's technique. Apply it correctly (e.g. boundary value → just below, on, and just above each limit).
- No duplicate test cases.`;

  const prompt = `${techniquesBlock(input.techniques ?? [])}

${requirementBlock(input.requirementText)}

${scenariosBlock(input.scenarios)}${previousIssuesBlock(previousIssues)}`;

  return { system, prompt };
}
