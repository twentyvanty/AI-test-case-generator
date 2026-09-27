import { z } from "zod";
import { TECHNIQUE_KEYS } from "./techniques.js";

// The single source of truth for what each AI answer must look like.
// The same schemas are (1) sent to the model as a JSON schema, so it answers
// in the right shape, and (2) used to check the answer ("format" check).

const techniqueKey = z.enum(TECHNIQUE_KEYS);
const text = (max) => z.string().trim().min(1).max(max);

export const techniqueSuggestionSchema = z.object({
  suggestions: z
    .array(
      z.object({
        technique: techniqueKey,
        reason: text(500),
      })
    )
    .min(1)
    .max(TECHNIQUE_KEYS.length),
});

export const scenarioDraftSchema = z.object({
  scenarios: z
    .array(
      z.object({
        title: text(255),
        description: text(2000),
        technique: techniqueKey,
        estimatedCases: z.number().int().min(1).max(20),
      })
    )
    .min(1)
    .max(30),
});

export const testCaseSetSchema = z.object({
  testCases: z
    .array(
      z.object({
        // Which input scenario this case belongs to: "S1", "S2", …
        scenarioKey: z.string().regex(/^S\d+$/),
        title: text(255),
        description: text(2000),
        precondition: z.string().trim().max(2000),
        steps: z.array(text(1000)).min(1).max(25),
        expectedResult: text(2000),
        technique: techniqueKey,
      })
    )
    .min(1)
    .max(300),
});

export const CHECK_STATUSES = ["pass", "warn", "fail"];

export const checkResultSchema = z.object({
  status: z.enum(CHECK_STATUSES),
  issues: z.array(z.string().trim().min(1).max(500)).max(30),
});

// What the AI validator returns (the format check is done in code, not by AI)
export const validatorReportSchema = z.object({
  requirementCoverage: checkResultSchema,
  techniqueCompliance: checkResultSchema,
  rules: checkResultSchema,
});

// Keywords left out of the schema sent to the AI provider. Gemini rejects some
// list-size limits ("Request contains an invalid argument", found 2026-09-27),
// and other providers support even fewer. The zod schemas above still enforce
// them when the answer is checked, so nothing is lost.
const NOT_SENT_TO_PROVIDER = new Set(["$schema", "minItems", "maxItems"]);

function stripKeywords(value) {
  if (Array.isArray(value)) {
    return value.map(stripKeywords);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !NOT_SENT_TO_PROVIDER.has(key))
      .map(([key, child]) => [key, stripKeywords(child)])
  );
}

// zod schema → plain JSON schema for the provider's structured output
export function toJsonSchema(schema) {
  return stripKeywords(z.toJSONSchema(schema));
}

// zod error → short readable issues, e.g. "scenarios.2.estimatedCases: expected number"
export function formatZodIssues(error, max = 10) {
  const issues = error.issues.slice(0, max).map((issue) => {
    const where = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    return `${where}: ${issue.message}`;
  });

  if (error.issues.length > max) {
    issues.push(`…and ${error.issues.length - max} more problems`);
  }

  return issues;
}
