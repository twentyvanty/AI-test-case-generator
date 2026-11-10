import { ProviderQuotaError, ProviderUnavailableError } from "../errors.js";
import { createGeminiProvider } from "./gemini.provider.js";
import { createMockProvider } from "./mock.provider.js";
import { createOpenRouterProvider } from "./openrouter.provider.js";
import { debug } from "./reliability.js";

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
// Reads requirement images. Chosen 2026-11-10 (suggested by the partner company):
// on a Thai swimlane diagram it read every label and the whole flow correctly in
// 37 s (one small typo), while every free OpenRouter model failed (see docs).
export const DEFAULT_GEMINI_VISION_MODEL = "gemini-3.5-flash";

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
// Reads requirement images when Gemini isn't available or is busy. Chosen 2026-11-10
// by reading the same Thai screenshot with every free image model: nano-omni was
// the most accurate and kept the layout (~76 s); super-vl once invented a different
// requirement, dots timed out, the Gemma models were overloaded. Gemma is the
// fallback: when its host is busy the tester gets "try again", never invented text.
export const DEFAULT_OPENROUTER_VISION_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";
export const DEFAULT_OPENROUTER_VISION_FALLBACK = "google/gemma-4-31b-it:free";

// Time limit for one AI request
export const DEFAULT_TIMEOUT_SECONDS = 120;

// "none" or "" → no fallback
function fallback(value, defaultModel) {
  if (value === undefined) {
    return defaultModel;
  }

  return value && value !== "none" ? value : null;
}

// Per role: [main model setting, its default, fallback setting, its default]
const OPENROUTER_ROLES = {
  generator: ["OPENROUTER_GENERATOR_MODEL", DEFAULT_OPENROUTER_GENERATOR_MODEL, "OPENROUTER_GENERATOR_FALLBACK_MODEL", DEFAULT_OPENROUTER_GENERATOR_FALLBACK],
  validator: ["OPENROUTER_VALIDATOR_MODEL", DEFAULT_OPENROUTER_VALIDATOR_MODEL, "OPENROUTER_VALIDATOR_FALLBACK_MODEL", DEFAULT_OPENROUTER_VALIDATOR_FALLBACK],
  vision: ["OPENROUTER_VISION_MODEL", DEFAULT_OPENROUTER_VISION_MODEL, "OPENROUTER_VISION_FALLBACK_MODEL", DEFAULT_OPENROUTER_VISION_FALLBACK],
};

const GEMINI_ROLES = {
  generator: ["GEMINI_GENERATOR_MODEL", DEFAULT_GEMINI_GENERATOR_MODEL, "GEMINI_GENERATOR_FALLBACK_MODEL", DEFAULT_GEMINI_GENERATOR_FALLBACK],
  validator: ["GEMINI_VALIDATOR_MODEL", DEFAULT_GEMINI_VALIDATOR_MODEL, "GEMINI_VALIDATOR_FALLBACK_MODEL", DEFAULT_GEMINI_VALIDATOR_FALLBACK],
  vision: ["GEMINI_VISION_MODEL", DEFAULT_GEMINI_VISION_MODEL, "GEMINI_VISION_FALLBACK_MODEL", DEFAULT_GEMINI_GENERATOR_FALLBACK],
};

function modelsFor(roles, role, env) {
  const [modelKey, modelDefault, fallbackKey, fallbackDefault] = roles[role];

  return {
    model: env[modelKey] || modelDefault,
    fallbackModel: fallback(env[fallbackKey], fallbackDefault),
  };
}

const timeoutMs = (env) => (Number(env.AI_REQUEST_TIMEOUT_SECONDS) || DEFAULT_TIMEOUT_SECONDS) * 1000;

const PROVIDERS = {
  openrouter: (role, env) =>
    createOpenRouterProvider({
      apiKey: env.OPENROUTER_API_KEY,
      ...modelsFor(OPENROUTER_ROLES, role, env),
      timeoutMs: timeoutMs(env),
      appUrl: env.OPENROUTER_APP_URL,
      appName: env.OPENROUTER_APP_NAME || "AI Test Case Generator",
    }),

  gemini: (role, env) =>
    createGeminiProvider({
      apiKey: env.GEMINI_API_KEY,
      ...modelsFor(GEMINI_ROLES, role, env),
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

// Uses `main`; when it's busy, too slow or out of quota (after its own retries and
// fallback model), hands the same request to `backup`, a different provider.
// Any other error (bad key, invalid request) is a setup problem and is shown as is.
export function withBackupProvider(main, backup) {
  const canSwitch = (error) =>
    error instanceof ProviderUnavailableError || error instanceof ProviderQuotaError;

  return {
    name: `${main.name}+${backup.name}`,
    model: main.model,
    fallbackModel: main.fallbackModel,
    backup,

    async generateJson(request) {
      try {
        return await main.generateJson(request);
      } catch (error) {
        if (!canSwitch(error)) {
          throw error;
        }

        debug(`  ${main.name} unavailable → trying ${backup.name}`);

        try {
          return await backup.generateJson(request);
        } catch (backupError) {
          if (!canSwitch(backupError)) {
            throw backupError;
          }

          throw new ProviderUnavailableError(`${error.message} Also: ${backupError.message}`, {
            cause: backupError,
          });
        }
      }
    },
  };
}

// Image reading: Gemini when its key is set (by far the best reader in our tests),
// backed up by OpenRouter when that key is set too. AI_VISION_PROVIDER forces one.
function visionProvider(env, fallback) {
  if (env.AI_VISION_PROVIDER) {
    return create(env.AI_VISION_PROVIDER, "vision", env);
  }

  if (!env.GEMINI_API_KEY) {
    return create(fallback, "vision", env);
  }

  const gemini = create("gemini", "vision", env);

  return env.OPENROUTER_API_KEY
    ? withBackupProvider(gemini, create("openrouter", "vision", env))
    : gemini;
}

// Picks the generator, validator and vision (image reading) providers from env:
//   AI_GENERATOR_PROVIDER / AI_VALIDATOR_PROVIDER / AI_VISION_PROVIDER = openrouter | gemini | mock
// Default for text: openrouter when OPENROUTER_API_KEY is set, else gemini when
// GEMINI_API_KEY is set, otherwise mock. Default for images: see visionProvider.
export function getProviders(env = process.env) {
  const fallback = env.OPENROUTER_API_KEY ? "openrouter" : env.GEMINI_API_KEY ? "gemini" : "mock";

  return {
    generator: create(env.AI_GENERATOR_PROVIDER || fallback, "generator", env),
    validator: create(env.AI_VALIDATOR_PROVIDER || fallback, "validator", env),
    vision: visionProvider(env, fallback),
  };
}
