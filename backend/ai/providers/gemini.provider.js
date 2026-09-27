import { GoogleGenAI } from "@google/genai";
import {
  ProviderAuthError,
  ProviderError,
  ProviderQuotaError,
  ProviderUnavailableError,
} from "../errors.js";

// Longest we wait for ONE request. A test-case answer normally takes 30–70 s on
// the free tier; much longer means the model is stuck (seen: 17 min hangs).
const DEFAULT_TIMEOUT_MS = 120_000;

// Waits before re-trying a model that answered "busy" (HTTP 5xx)
const BUSY_RETRY_WAITS_MS = [3_000, 8_000];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// AI_DEBUG=1 prints every request with timings to stderr (for troubleshooting)
const debug = (...parts) => {
  if (process.env.AI_DEBUG) {
    console.error(`[ai ${new Date().toISOString().slice(11, 19)}]`, ...parts);
  }
};

// Resolves/rejects like `promise`, but rejects with a TimeoutError after `ms`
// no matter what — even if the SDK ignores the abort signal.
function withDeadline(promise, ms, onTimeout) {
  let timer;

  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      onTimeout();
      reject(Object.assign(new Error(`timed out after ${ms} ms`), { name: "TimeoutError" }));
    }, ms);
  });

  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

// Gemini errors often carry a JSON body — pull out just the human message
function readableMessage(raw) {
  try {
    return JSON.parse(raw)?.error?.message ?? raw;
  } catch {
    return raw;
  }
}

// The request took longer than our time limit (we cancelled it)
function isTimeout(error) {
  return (
    error?.name === "TimeoutError" ||
    error?.name === "AbortError" ||
    /aborted|timed? ?out/i.test(String(error?.message ?? ""))
  );
}

// Google answered "busy / temporarily down", or the connection dropped
function isBusy(error) {
  const status = error?.status;
  const text = String(error?.message ?? "");

  return (
    (status >= 500 && status <= 504) ||
    /high demand|overloaded|UNAVAILABLE|fetch failed|ECONNRESET|socket hang up/i.test(text)
  );
}

// Turn an SDK error into one of our error types (see ../errors.js)
function toProviderError(error, model) {
  const status = error?.status;
  const raw = String(error?.message ?? error);

  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw)) {
    return new ProviderQuotaError(
      `Gemini rate limit or quota reached for ${model}. On the free tier, wait a minute (or until tomorrow for daily limits) and try again.`,
      { cause: error }
    );
  }

  if (status === 401 || status === 403 || /API_KEY_INVALID|API key not valid/i.test(raw)) {
    return new ProviderAuthError(
      "Gemini rejected the API key. Check GEMINI_API_KEY in backend/.env (create one at aistudio.google.com).",
      { cause: error, status }
    );
  }

  if (status === 404 || /is not found|not supported for generateContent/i.test(raw)) {
    return new ProviderAuthError(
      `Gemini model "${model}" isn't available for this key (${readableMessage(raw)}). Check the GEMINI_*_MODEL settings in backend/.env.`,
      { cause: error, status }
    );
  }

  // 400 = our request itself is invalid (e.g. a schema Gemini doesn't accept).
  // Sending the same request again can't work, so stop instead of retrying.
  return new ProviderError(`Gemini request failed (${model}): ${readableMessage(raw)}`, {
    cause: error,
    status,
    fatal: status === 400,
  });
}

// Google Gemini (works with free-tier and paid keys — same code).
//   model          main model
//   fallbackModel  used if the main model is busy or too slow (optional)
//   timeoutMs      time limit for one request
//   client         only for tests: a fake GoogleGenAI-like object
//   waits          only for tests: pauses between busy retries
export function createGeminiProvider({
  apiKey,
  model,
  fallbackModel = null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  client,
  waits = BUSY_RETRY_WAITS_MS,
}) {
  if (!apiKey && !client) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to backend/.env or use AI_*_PROVIDER=mock."
    );
  }

  const ai = client ?? new GoogleGenAI({ apiKey });

  // One request. After timeoutMs we cancel it (abort signal) AND stop waiting for it
  // (deadline), so a stuck request can never hold us up longer than the limit.
  async function callOnce(modelName, { system, prompt, jsonSchema }) {
    const controller = new AbortController();
    const started = Date.now();
    debug(`→ ${modelName} request`);

    try {
      const response = await withDeadline(
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: system,
            responseMimeType: "application/json",
            responseJsonSchema: jsonSchema,
            abortSignal: controller.signal,
          },
        }),
        timeoutMs,
        () => controller.abort()
      );

      debug(`← ${modelName} answered in ${Date.now() - started} ms`);
      return response;
    } catch (error) {
      debug(`✗ ${modelName} failed after ${Date.now() - started} ms:`, error?.name, error?.status ?? "", String(error?.message).slice(0, 120));
      throw error;
    }
  }

  // One model: retry "busy" answers after a short wait; give up at once on a timeout
  // (a model that hung once usually hangs again — better to switch models).
  async function callModel(modelName, request) {
    for (let retry = 0; ; retry++) {
      try {
        return await callOnce(modelName, request);
      } catch (error) {
        const canRetry = isBusy(error) && !isTimeout(error) && retry < waits.length;

        if (!canRetry) {
          throw error;
        }

        debug(`  busy → waiting ${waits[retry]} ms before retrying ${modelName}`);
        await sleep(waits[retry]);
      }
    }
  }

  return {
    name: "gemini",
    model,
    fallbackModel,

    async generateJson(request) {
      let response;
      let usedModel = model;

      try {
        response = await callModel(model, request);
      } catch (error) {
        if (!isBusy(error) && !isTimeout(error)) {
          throw toProviderError(error, model);
        }

        // Main model busy or too slow → try the fallback model
        if (!fallbackModel || fallbackModel === model) {
          throw unavailableError([model], error, timeoutMs);
        }

        try {
          usedModel = fallbackModel;
          response = await callModel(fallbackModel, request);
        } catch (fallbackError) {
          throw isBusy(fallbackError) || isTimeout(fallbackError)
            ? unavailableError([model, fallbackModel], fallbackError, timeoutMs)
            : toProviderError(fallbackError, fallbackModel);
        }
      }

      const text = response.text;

      if (!text) {
        const reason = response.candidates?.[0]?.finishReason ?? "unknown";
        throw new ProviderError(`Gemini returned no text (finish reason: ${reason})`);
      }

      let data;

      try {
        data = JSON.parse(text);
      } catch (error) {
        throw new ProviderError("Gemini answered with text that isn't valid JSON", {
          cause: error,
          code: "INVALID_JSON",
        });
      }

      const usage = response.usageMetadata ?? {};

      return {
        data,
        model: usedModel, // which model actually answered (main or fallback)
        usage: {
          input: usage.promptTokenCount ?? 0,
          // "Thinking" tokens are billed as output
          output: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0),
        },
      };
    },
  };
}

function unavailableError(models, cause, timeoutMs) {
  const why = isTimeout(cause)
    ? `didn't answer within ${Math.round(timeoutMs / 1000)} s`
    : "is busy (high demand)";

  return new ProviderUnavailableError(
    `Gemini ${why} — tried ${models.join(" and ")}. Please try again in a few minutes.`,
    { cause, status: cause?.status }
  );
}
