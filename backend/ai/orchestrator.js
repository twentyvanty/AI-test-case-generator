import { ProviderError } from "./errors.js";
import {
  formatZodIssues,
  scenarioDraftSchema,
  techniqueSuggestionSchema,
  testCaseSetSchema,
  toJsonSchema,
  validatorReportSchema,
} from "./schemas.js";
import { countFailures, mergeResults, pass } from "./checks/result.js";
import { checkStructure } from "./checks/structure.js";
import { checkDuplicates } from "./checks/duplicates.js";
import { checkSensitiveData } from "./checks/sensitiveData.js";
import { suggestTechniquesPrompt } from "./prompts/suggestTechniques.js";
import { draftScenariosPrompt } from "./prompts/draftScenarios.js";
import { generateTestCasesPrompt } from "./prompts/generateTestCases.js";
import { validatePrompt } from "./prompts/validate.js";

export const MAX_ATTEMPTS = 3;

const KINDS = {
  TECHNIQUE_SUGGESTION: {
    schema: techniqueSuggestionSchema,
    buildPrompt: suggestTechniquesPrompt,
    aiValidation: false, // cheap helper call: format check only
  },
  SCENARIOS: {
    schema: scenarioDraftSchema,
    buildPrompt: draftScenariosPrompt,
    aiValidation: true,
  },
  TEST_CASES: {
    schema: testCaseSetSchema,
    buildPrompt: generateTestCasesPrompt,
    aiValidation: true,
  },
};

const notChecked = (reason) => ({ status: "warn", issues: [reason] });

function issuesOf(checks) {
  return Object.entries(checks).flatMap(([name, check]) =>
    check.status === "pass" ? [] : check.issues.map((issue) => `[${name}] ${issue}`)
  );
}

/**
 * Runs one AI generation: generate → format check → rule checks → AI validation,
 * retrying up to MAX_ATTEMPTS times with the previous attempt's issues.
 *
 * Returns an object shaped like the GenerationRun table:
 * { kind, status: "PASSED" | "NEEDS_REVIEW" | "FAILED", attempts, output,
 *   validation: { final, attempts: [...] }, usage, generatorModel, validatorModel, errorMessage }
 */
export async function runPipeline({ kind, input, generator, validator, maxAttempts = MAX_ATTEMPTS }) {
  const config = KINDS[kind];

  if (!config) {
    throw new Error(`Unknown generation kind: ${kind}`);
  }

  const jsonSchema = toJsonSchema(config.schema);
  const validatorJsonSchema = toJsonSchema(validatorReportSchema);
  const usage = { generator: { input: 0, output: 0 }, validator: { input: 0, output: 0 } };
  // Models that actually answered (a provider may switch to its fallback model)
  const usedModels = { generator: new Set(), validator: new Set() };
  const modelName = (role, provider) =>
    usedModels[role].size > 0 ? [...usedModels[role]].join(", ") : provider.model;
  const attempts = []; // { attempt, passed, checks, output? }

  const finish = (status, chosen, errorMessage = null) => ({
    kind,
    status,
    attempts: attempts.length,
    output: chosen?.output ?? null,
    validation: {
      final: chosen?.checks ?? null,
      attempts: attempts.map(({ output: _output, ...rest }) => rest),
    },
    usage,
    generatorModel: modelName("generator", generator),
    validatorModel: config.aiValidation ? modelName("validator", validator) : "none",
    errorMessage,
  });

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const previousIssues = attempts.length > 0 ? issuesOf(attempts.at(-1).checks) : [];
    const { system, prompt } = config.buildPrompt(input, previousIssues);

    // How long each AI call took in this attempt, e.g. { generator: 31.2, validator: 4.8 }
    const seconds = {};
    const timed = async (role, call) => {
      const started = performance.now();

      try {
        return await call();
      } finally {
        seconds[role] = Math.round((performance.now() - started) / 100) / 10;
      }
    };

    // 1. Generate
    let raw;

    try {
      const result = await timed("generator", () =>
        generator.generateJson({
          system,
          prompt,
          jsonSchema,
          task: { kind, input, attempt, role: "generator" },
        })
      );

      raw = result.data;
      usedModels.generator.add(result.model ?? generator.model);
      usage.generator.input += result.usage?.input ?? 0;
      usage.generator.output += result.usage?.output ?? 0;
    } catch (error) {
      if (!(error instanceof ProviderError)) {
        throw error; // a bug in our code, not an AI problem
      }

      // Invalid JSON is the model's fault (format); anything else is the provider's
      const check = error.code === "INVALID_JSON" ? "format" : "provider";

      attempts.push({
        attempt,
        passed: false,
        seconds,
        checks: { [check]: { status: "fail", issues: [error.message] } },
      });

      if (error.fatal) {
        // Quota / bad key / missing model / servers busy: retrying straight away can't help
        return finish("FAILED", null, error.message);
      }

      continue;
    }

    // 2. Format: schema + references to the input
    const parsed = config.schema.safeParse(raw);

    if (!parsed.success) {
      attempts.push({
        attempt,
        passed: false,
        seconds,
        checks: { format: { status: "fail", issues: formatZodIssues(parsed.error) } },
      });
      continue;
    }

    const output = parsed.data;
    const format = checkStructure(kind, output, input);

    if (!config.aiValidation) {
      const checks = { format };
      const passed = format.status !== "fail";

      attempts.push({ attempt, passed, seconds, checks, output });

      if (passed) {
        return finish("PASSED", attempts.at(-1));
      }

      continue;
    }

    // 3. Rule checks in code
    const ruleChecks = mergeResults(checkDuplicates(kind, output), checkSensitiveData(output));

    // 4. AI validation by a different model
    let report;
    let validatorProblem = null;

    try {
      const result = await timed("validator", () =>
        validator.generateJson({
          ...validatePrompt(kind, input, output),
          jsonSchema: validatorJsonSchema,
          task: { kind, input, attempt, role: "validator", output },
        })
      );

      usedModels.validator.add(result.model ?? validator.model);
      usage.validator.input += result.usage?.input ?? 0;
      usage.validator.output += result.usage?.output ?? 0;

      const parsedReport = validatorReportSchema.safeParse(result.data);

      if (parsedReport.success) {
        report = parsedReport.data;
      } else {
        validatorProblem = "The validator returned an unreadable report, so this wasn't checked by AI";
      }
    } catch (error) {
      if (!(error instanceof ProviderError)) {
        throw error;
      }

      // The output itself may be fine — keep it, but mark it as not AI-checked
      validatorProblem = `AI validation couldn't run: ${error.message}`;
    }

    const checks = {
      format,
      requirementCoverage: report?.requirementCoverage ?? notChecked(validatorProblem),
      techniqueCompliance: report?.techniqueCompliance ?? notChecked(validatorProblem),
      rules: mergeResults(ruleChecks, report?.rules ?? pass()),
    };

    // An output the AI couldn't check is never auto-approved
    const passed = countFailures(checks) === 0 && !validatorProblem;

    attempts.push({ attempt, passed, seconds, checks, output });

    if (passed) {
      return finish("PASSED", attempts.at(-1));
    }

    // Validator unavailable: retrying the generator won't fix that
    if (validatorProblem) {
      return finish("NEEDS_REVIEW", attempts.at(-1), validatorProblem);
    }
  }

  // Out of attempts: give the tester the best usable draft to fix by hand
  const usable = attempts.filter((item) => item.output);

  if (usable.length === 0) {
    return finish(
      "FAILED",
      null,
      `The AI didn't return a usable result after ${attempts.length} attempts.`
    );
  }

  const best = usable.reduce((bestSoFar, item) =>
    countFailures(item.checks) <= countFailures(bestSoFar.checks) ? item : bestSoFar
  );

  return finish(
    "NEEDS_REVIEW",
    best,
    `The result didn't pass validation after ${attempts.length} attempts. Please review and edit it manually.`
  );
}
