import OpenAI from "openai";
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

// OpenRouter: one API key for many models (free ":free" models and paid ones).
// It speaks the OpenAI Chat Completions format, so we use the `openai` SDK with
// OpenRouter's address. Free tier → paid tier is only a change of model names in .env.

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// The model can't do structured output (json_schema) → we retry with plain JSON mode
// (Real message, 2026-11-06: "No endpoints found that can handle the requested parameters")
const UNSUPPORTED_JSON_SCHEMA =
  /response_format|json_schema|structured|requested parameters|No endpoints found that (?:support|can handle)/i;

// A 429 from the model's HOST ("Provider returned error") means that free host is
// overloaded right now — not that this account used up its limit (that one says
// "Rate limit exceeded"). Treat it as "busy": wait, retry, then the fallback model.
const UPSTREAM_BUSY = /Provider returned error|rate-limited upstream|temporarily rate-limited/i;

function asBusyIfUpstream(error) {
  if (error?.status === 429 && UPSTREAM_BUSY.test(String(error?.message))) {
    return Object.assign(new Error(`${error.message} (the model's host is busy)`), {
      status: 503,
      cause: error,
    });
  }

  return error;
}

const CANT_READ_IMAGES = /image input|support image|image_url|images? (?:is|are) not supported/i;

// The user message: plain text, or text + images (data URLs) for the vision role
function userContent(prompt, images) {
  if (!images?.length) {
    return prompt;
  }

  return [
    { type: "text", text: prompt },
    ...images.map((image) => ({
      type: "image_url",
      image_url: { url: `data:${image.mimeType};base64,${image.base64}` },
    })),
  ];
}

// Turn an API error into one of our error types (see ../errors.js)
function toProviderError(error, model) {
  const status = error?.status;
  const raw = String(error?.message ?? error);

  if (status === 429 || /rate limit/i.test(raw)) {
    return new ProviderQuotaError(
      `OpenRouter rate limit reached for ${model}. Free models allow about 20 requests a minute and 50 a day (1,000 a day once $10 of credits has been bought). Wait a minute — or until tomorrow — and try again.`,
      { cause: error }
    );
  }

  if (status === 402) {
    return new ProviderQuotaError(
      `OpenRouter has no credits left for ${model}. Add credits at openrouter.ai/credits or switch to a ":free" model in backend/.env.`,
      { cause: error }
    );
  }

  if (status === 401) {
    return new ProviderAuthError(
      "OpenRouter rejected the API key. Check OPENROUTER_API_KEY in backend/.env (create one at openrouter.ai/keys).",
      { cause: error, status }
    );
  }

  // The model can't take images (only possible for the vision role)
  if (CANT_READ_IMAGES.test(raw)) {
    return new ProviderAuthError(
      `OpenRouter model "${model}" can't read images. Set OPENROUTER_VISION_MODEL in backend/.env to a model with image input.`,
      { cause: error, status }
    );
  }

  if (status === 404 || /not a valid model|No endpoints found|model not found/i.test(raw)) {
    return new ProviderAuthError(
      `OpenRouter model "${model}" isn't available (${readableMessage(raw)}). Check the OPENROUTER_*_MODEL settings in backend/.env.`,
      { cause: error, status }
    );
  }

  if (status === 403) {
    return new ProviderError(
      `OpenRouter refused the request for ${model} (blocked by moderation or permissions): ${readableMessage(raw)}`,
      { cause: error, status, fatal: true }
    );
  }

  // 400 = our request itself is invalid; sending it again can't work
  return new ProviderError(`OpenRouter request failed (${model}): ${readableMessage(raw)}`, {
    cause: error,
    status,
    fatal: status === 400,
  });
}

// Models answer with JSON, sometimes wrapped in ```json fences or with a sentence
// around it (in plain JSON mode). Take the outermost { … } and parse it.
export function parseJsonAnswer(text) {
  const unfenced = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(unfenced.slice(start, end + 1));
    }

    throw new SyntaxError("No JSON object in the answer");
  }
}

// OpenRouter (free and paid models — same code).
//   model          main model, e.g. "google/gemma-4-31b-it:free"
//   fallbackModel  used if the main model is busy or too slow (optional)
//   timeoutMs      time limit for one request
//   appUrl/appName optional attribution shown on openrouter.ai
//   client         only for tests: a fake OpenAI-like object
//   waits          only for tests: pauses between busy retries
export function createOpenRouterProvider({
  apiKey,
  model,
  fallbackModel = null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  appUrl,
  appName,
  client,
  waits = BUSY_RETRY_WAITS_MS,
}) {
  if (!apiKey && !client) {
    throw new Error(
      "OPENROUTER_API_KEY is not set. Add it to backend/.env or use AI_*_PROVIDER=mock."
    );
  }

  const ai =
    client ??
    new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE_URL,
      // Our own retry/fallback handles this; the SDK's retries would re-send slow requests
      maxRetries: 0,
      defaultHeaders: {
        ...(appUrl && { "HTTP-Referer": appUrl }),
        ...(appName && { "X-Title": appName }),
      },
    });

  // How each model is asked for JSON, from best to most basic. A model that rejects a
  // mode moves to the next one, remembered while the server runs:
  //   schema  structured output (json_schema) — the answer must follow our schema
  //   json    JSON mode (json_object) + the schema written in the prompt
  //   prompt  no format option at all, only the schema in the prompt
  // In every mode zod still checks the answer afterwards.
  const MODES = ["schema", "json", "prompt"];
  const modeOf = new Map();
  const currentMode = (modelName) => modeOf.get(modelName) ?? "schema";

  function requestBody(modelName, { system, prompt, jsonSchema, images }) {
    const mode = currentMode(modelName);

    if (mode === "schema") {
      return {
        model: modelName,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent(prompt, images) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "answer", strict: true, schema: jsonSchema },
        },
        // Only route to hosts of this model that really support structured output
        provider: { require_parameters: true },
      };
    }

    return {
      model: modelName,
      messages: [
        {
          role: "system",
          content: `${system}\n\nAnswer with ONE JSON object that matches this JSON Schema exactly (no other text):\n${JSON.stringify(jsonSchema)}`,
        },
        { role: "user", content: userContent(prompt, images) },
      ],
      ...(mode === "json" && { response_format: { type: "json_object" } }),
    };
  }

  // One request with our hard time limit (see reliability.js)
  async function callOnce(modelName, request) {
    const controller = new AbortController();
    const started = Date.now();
    debug(`→ ${modelName} request (${currentMode(modelName)} mode)`);

    try {
      const response = await withDeadline(
        ai.chat.completions.create(requestBody(modelName, request), { signal: controller.signal }),
        timeoutMs,
        () => controller.abort()
      );

      // OpenRouter can answer 200 with an error inside (failure during generation)
      if (response?.error) {
        throw Object.assign(new Error(response.error.message ?? "OpenRouter error"), {
          status: response.error.code,
        });
      }

      // An overloaded free host sometimes answers 200 with no text at all (seen
      // 2026-11-12: 6 empty answers in a row, 0 tokens). Asking the same host again
      // in the next attempt doesn't help, so treat it as "busy": wait, retry, then
      // the fallback model.
      const choice = response?.choices?.[0];

      if (!choice?.message?.content) {
        throw Object.assign(
          new Error(
            `${modelName} returned an empty answer (finish reason: ${choice?.finish_reason ?? "unknown"}, ${response?.usage?.completion_tokens ?? 0} output tokens): its host is likely overloaded`
          ),
          { status: 503 }
        );
      }

      debug(`← ${modelName} answered in ${Date.now() - started} ms`);
      return response;
    } catch (error) {
      debug(`✗ ${modelName} failed after ${Date.now() - started} ms:`, error?.name, error?.status ?? "", String(error?.message).slice(0, 120));
      throw asBusyIfUpstream(error);
    }
  }

  // One model; if it rejects the way we ask for JSON, step down to the next mode
  async function callModel(modelName, request) {
    for (;;) {
      try {
        return await withBusyRetries((name) => callOnce(name, request), modelName, waits);
      } catch (error) {
        const next = MODES[MODES.indexOf(currentMode(modelName)) + 1];
        const unsupported =
          next &&
          (error?.status === 400 || error?.status === 404) &&
          UNSUPPORTED_JSON_SCHEMA.test(String(error?.message)) &&
          // "can't take images" isn't solved by another JSON mode
          !CANT_READ_IMAGES.test(String(error?.message));

        if (!unsupported) {
          throw error;
        }

        debug(`  ${modelName} doesn't support ${currentMode(modelName)} mode → switching to ${next} mode`);
        modeOf.set(modelName, next);
      }
    }
  }

  return {
    name: "openrouter",
    model,
    fallbackModel,

    async generateJson(request) {
      const { response, usedModel } = await callWithFallback({
        serviceName: "OpenRouter",
        model,
        fallbackModel,
        timeoutMs,
        callModel: (modelName) => callModel(modelName, request),
        toProviderError,
      });

      const choice = response.choices?.[0];
      const text = choice?.message?.content;

      if (!text) {
        throw new ProviderError(
          `OpenRouter returned no text (finish reason: ${choice?.finish_reason ?? "unknown"})`
        );
      }

      let data;

      try {
        data = parseJsonAnswer(text);
      } catch (error) {
        throw new ProviderError("OpenRouter answered with text that isn't valid JSON", {
          cause: error,
          code: "INVALID_JSON",
        });
      }

      return {
        data,
        // Which model actually answered (main or fallback)
        model: usedModel,
        usage: {
          input: response.usage?.prompt_tokens ?? 0,
          // Includes "reasoning" tokens, which are billed as output
          output: response.usage?.completion_tokens ?? 0,
        },
      };
    },
  };
}
