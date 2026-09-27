// Developer tool: run the AI pipeline from the terminal (not part of the website).
// Explained in docs/ai-providers.md.
//
//   node --env-file=.env scripts/try-ai.js suggest   "<requirement>"
//   node --env-file=.env scripts/try-ai.js scenarios "<requirement>" [--techniques boundaryValue,equivalencePartitioning]
//   node --env-file=.env scripts/try-ai.js cases     "<requirement>" [--techniques …]
//
// Options:
//   --file <path>      read the requirement from a text file instead
//   --techniques a,b   technique keys (default: let the AI choose)
//   --json             print the full raw result as JSON

import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  draftScenarios,
  generateTestCases,
  suggestTechniques,
  TECHNIQUE_KEYS,
} from "../ai/index.js";
import { getProviders } from "../ai/providers/index.js";

const USAGE = `Usage: node --env-file=.env scripts/try-ai.js <suggest|scenarios|cases> "<requirement>" [--file path] [--techniques a,b] [--json]
Technique keys: ${TECHNIQUE_KEYS.join(", ")}`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    file: { type: "string" },
    techniques: { type: "string" },
    json: { type: "boolean", default: false },
  },
});

const [command, inlineText] = positionals;
const requirementText = values.file ? readFileSync(values.file, "utf8") : inlineText;
const techniques = values.techniques
  ? values.techniques.split(",").map((key) => key.trim()).filter(Boolean)
  : [];

if (!["suggest", "scenarios", "cases"].includes(command) || !requirementText?.trim()) {
  console.error(USAGE);
  process.exit(1);
}

const unknown = techniques.filter((key) => !TECHNIQUE_KEYS.includes(key));

if (unknown.length > 0) {
  console.error(`Unknown technique(s): ${unknown.join(", ")}\n${USAGE}`);
  process.exit(1);
}

const ICON = { pass: "✓", warn: "⚠", fail: "✗" };

function printRun(title, result, seconds) {
  console.log(`\n=== ${title} ===`);
  console.log(`Status:  ${result.status}  (${result.attempts} attempt(s), ${seconds.toFixed(1)}s)`);
  console.log(`Models:  generator ${result.generatorModel} · validator ${result.validatorModel}`);

  for (const attempt of result.validation.attempts) {
    const checks = Object.entries(attempt.checks)
      .map(([name, check]) => `${ICON[check.status]} ${name}`)
      .join("  ");
    const time = Object.entries(attempt.seconds ?? {})
      .map(([role, value]) => `${role} ${value}s`)
      .join(", ");
    console.log(
      `Attempt ${attempt.attempt}: ${attempt.passed ? "passed" : "rejected"}  ${checks}${time ? `  (${time})` : ""}`
    );

    for (const [name, check] of Object.entries(attempt.checks)) {
      for (const issue of check.issues) {
        console.log(`    ${ICON[check.status]} [${name}] ${issue}`);
      }
    }
  }

  const { generator, validator } = result.usage;
  console.log(
    `Tokens:  generator ${generator.input} in / ${generator.output} out · validator ${validator.input} in / ${validator.output} out`
  );

  if (result.errorMessage) {
    console.log(`Message: ${result.errorMessage}`);
  }
}

function printOutput(kind, output, scenarios) {
  if (!output) {
    return;
  }

  console.log("");

  if (kind === "suggest") {
    for (const item of output.suggestions) {
      console.log(`• ${item.technique}: ${item.reason}`);
    }
  } else if (kind === "scenarios") {
    output.scenarios.forEach((scenario, index) => {
      console.log(`SC-${String(index + 1).padStart(2, "0")}  ${scenario.title}`);
      console.log(`      ${scenario.technique}, ~${scenario.estimatedCases} cases — ${scenario.description}`);
    });
  } else {
    for (const scenario of scenarios) {
      const cases = output.testCases.filter((testCase) => testCase.scenarioKey === scenario.key);
      console.log(`\n${scenario.key}  ${scenario.title}  (${cases.length} cases)`);

      for (const testCase of cases) {
        console.log(`  • ${testCase.title}`);
        if (testCase.precondition) console.log(`      Pre:  ${testCase.precondition}`);
        testCase.steps.forEach((step, index) => console.log(`      ${index + 1}. ${step}`));
        console.log(`      Expect: ${testCase.expectedResult}`);
      }
    }
  }
}

async function timed(run) {
  const started = performance.now();
  const result = await run();
  return { result, seconds: (performance.now() - started) / 1000 };
}

const providers = getProviders();
console.log(`Using generator: ${providers.generator.name} (${providers.generator.model}), validator: ${providers.validator.name} (${providers.validator.model})`);

if (command === "suggest") {
  const { result, seconds } = await timed(() => suggestTechniques({ requirementText }, providers));
  printRun("Technique suggestion", result, seconds);
  printOutput("suggest", result.output);
  if (values.json) console.log(JSON.stringify(result, null, 2));
} else {
  const { result: draft, seconds } = await timed(() =>
    draftScenarios({ requirementText, techniques }, providers)
  );
  printRun("Scenario draft", draft, seconds);

  if (command === "scenarios" || !draft.output) {
    printOutput("scenarios", draft.output);
    if (values.json) console.log(JSON.stringify(draft, null, 2));
  } else {
    // "cases": use every drafted scenario as if the tester selected them all
    const scenarios = draft.output.scenarios.map((scenario, index) => ({
      ...scenario,
      key: `S${index + 1}`,
    }));

    const { result, seconds: caseSeconds } = await timed(() =>
      generateTestCases({ requirementText, techniques, scenarios }, providers)
    );
    printRun("Test cases", result, caseSeconds);
    printOutput("cases", result.output, scenarios);
    if (values.json) console.log(JSON.stringify(result, null, 2));
  }
}
