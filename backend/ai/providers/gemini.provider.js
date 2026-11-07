import { GoogleGenAI } from "@google/genai";
import { ProviderAuthError, ProviderError, ProviderQuotaError } from "../errors.js";
import {
  BUSY_RETRY_WAITS_MS,
  DEFAULT_TIMEOUT_MS,
  callWithFallback,
  debug,
  readableMessage,
  withBusyRetries,
  withDeadline,
} from "./reliability.js";

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

  return {
    name: "gemini",
    model,
    fallbackModel,

    async generateJson(request) {
      const { response, usedModel } = await callWithFallback({
        serviceName: "Gemini",
        model,
        fallbackModel,
        timeoutMs,
        callModel: (modelName) =>
          withBusyRetries((name) => callOnce(name, request), modelName, waits),
        toProviderError,
      });

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
