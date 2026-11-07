import { createGeminiProvider } from "./gemini.provider.js";
import { createMockProvider } from "./mock.provider.js";
import { createOpenRouterProvider } from "./openrouter.provider.js";

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

// OpenRouter defaults (free models; paid later = change these names in .env).
// Chosen 2026-11-06/07 by sending the same Thai scenario-draft prompt to every free
// model and by full runs (see docs/ai-providers.md): the generator is the most
// capable model; the validator is nemotron-3.5-super-vl — a different model (D-006)
// and the only free validator whose objections were all correct (xing, cohere and
// dots rejected good drafts with false claims; dots also garbled Thai). Each fallback
// runs on a different host from its main model, so they don't fail together (the two
// Gemma models were both overloaded).
export const DEFAULT_OPENROUTER_GENERATOR_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
export const DEFAULT_OPENROUTER_VALIDATOR_MODEL = "nvidia/nemotron-3.5-super-vl:free";
export const DEFAULT_OPENROUTER_GENERATOR_FALLBACK = "recursive/flint-v1.0:free";
export const DEFAULT_OPENROUTER_VALIDATOR_FALLBACK = "cohere/north-mini-code:free";

// Time limit for one AI request
export const DEFAULT_TIMEOUT_SECONDS = 120;

// "none" or "" → no fallback
function fallback(value, defaultModel) {
  if (value === undefined) {
    return defaultModel;
  }

  return value && value !== "none" ? value : null;
}

const timeoutMs = (env) => (Number(env.AI_REQUEST_TIMEOUT_SECONDS) || DEFAULT_TIMEOUT_SECONDS) * 1000;

const PROVIDERS = {
  openrouter: (role, env) =>
    createOpenRouterProvider({
      apiKey: env.OPENROUTER_API_KEY,
      model:
        role === "generator"
          ? env.OPENROUTER_GENERATOR_MODEL || DEFAULT_OPENROUTER_GENERATOR_MODEL
          : env.OPENROUTER_VALIDATOR_MODEL || DEFAULT_OPENROUTER_VALIDATOR_MODEL,
      fallbackModel:
        role === "generator"
          ? fallback(env.OPENROUTER_GENERATOR_FALLBACK_MODEL, DEFAULT_OPENROUTER_GENERATOR_FALLBACK)
          : fallback(env.OPENROUTER_VALIDATOR_FALLBACK_MODEL, DEFAULT_OPENROUTER_VALIDATOR_FALLBACK),
      timeoutMs: timeoutMs(env),
      appUrl: env.OPENROUTER_APP_URL,
      appName: env.OPENROUTER_APP_NAME || "AI Test Case Generator",
    }),

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
      timeoutMs: timeoutMs(env),
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
//   AI_GENERATOR_PROVIDER / AI_VALIDATOR_PROVIDER = openrouter | gemini | mock
// Default: openrouter when OPENROUTER_API_KEY is set, else gemini when
// GEMINI_API_KEY is set, otherwise mock.
export function getProviders(env = process.env) {
  const fallback = env.OPENROUTER_API_KEY ? "openrouter" : env.GEMINI_API_KEY ? "gemini" : "mock";

  return {
    generator: create(env.AI_GENERATOR_PROVIDER || fallback, "generator", env),
    validator: create(env.AI_VALIDATOR_PROVIDER || fallback, "validator", env),
  };
}
