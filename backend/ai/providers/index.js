import { createGeminiProvider } from "./gemini.provider.js";
import { createMockProvider } from "./mock.provider.js";

// Default models. Change them in backend/.env — no code change needed.
// Chosen from free-tier measurements on 2026-09-27: gemini-3.5-flash answered test
// cases in 30–70 s, while the newest gemini-3.8-flash was often overloaded, once hung
// for 17 minutes, and has a small daily quota. The 2.5 models are no longer
// available to new keys.
export const DEFAULT_GEMINI_GENERATOR_MODEL = "gemini-3.5-flash";
export const DEFAULT_GEMINI_VALIDATOR_MODEL = "gemini-3.5-flash-lite";
// Tried when the main model is busy or too slow; set to "none" to disable.
export const DEFAULT_GEMINI_GENERATOR_FALLBACK = "gemini-3.7-flash";
export const DEFAULT_GEMINI_VALIDATOR_FALLBACK = "gemini-3.1-flash-lite";
// Time limit for one AI request
export const DEFAULT_TIMEOUT_SECONDS = 120;

// "none" or "" → no fallback
function fallback(value, defaultModel) {
  if (value === undefined) {
    return defaultModel;
  }

  return value && value !== "none" ? value : null;
}

const PROVIDERS = {
  gemini: (role, env) =>
    createGeminiProvider({
      apiKey: env.GEMINI_API_KEY,
      model:
        role === "generator"
          ? env.GEMINI_GENERATOR_MODEL || DEFAULT_GEMINI_GENERATOR_MODEL
          : env.GEMINI_VALIDATOR_MODEL || DEFAULT_GEMINI_VALIDATOR_MODEL,
      fallbackModel:
        role === "generator"
          ? fallback(env.GEMINI_GENERATOR_FALLBACK_MODEL, DEFAULT_GEMINI_GENERATOR_FALLBACK)
          : fallback(env.GEMINI_VALIDATOR_FALLBACK_MODEL, DEFAULT_GEMINI_VALIDATOR_FALLBACK),
      timeoutMs: (Number(env.AI_REQUEST_TIMEOUT_SECONDS) || DEFAULT_TIMEOUT_SECONDS) * 1000,
    }),

  mock: (role, env) => createMockProvider({ role, failMode: env.MOCK_FAIL_MODE || "never" }),

  // To add a provider (e.g. openai, claude), see docs/ai-providers.md
};

function create(name, role, env) {
  const factory = PROVIDERS[name];

  if (!factory) {
    throw new Error(
      `Unknown AI provider "${name}" for ${role}. Available: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }

  return factory(role, env);
}

// Picks the generator and validator from env:
//   AI_GENERATOR_PROVIDER / AI_VALIDATOR_PROVIDER = gemini | mock
// Default: gemini when GEMINI_API_KEY is set, otherwise mock.
export function getProviders(env = process.env) {
  const fallback = env.GEMINI_API_KEY ? "gemini" : "mock";

  return {
    generator: create(env.AI_GENERATOR_PROVIDER || fallback, "generator", env),
    validator: create(env.AI_VALIDATOR_PROVIDER || fallback, "validator", env),
  };
}
