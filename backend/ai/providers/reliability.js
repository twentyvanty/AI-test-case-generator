import { ProviderUnavailableError } from "../errors.js";

// Shared by the real providers (gemini.provider.js, openrouter.provider.js):
// time limits, "busy" detection and the retry → fallback-model flow.

// Longest we wait for ONE request. Answers normally take 30–70 s on free tiers;
// much longer means the model is stuck (seen: 17 min hangs).
export const DEFAULT_TIMEOUT_MS = 120_000;

// Waits before re-trying a model that answered "busy" (HTTP 5xx)
export const BUSY_RETRY_WAITS_MS = [3_000, 8_000];

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// AI_DEBUG=1 prints every request with timings to stderr (for troubleshooting)
export const debug = (...parts) => {
  if (process.env.AI_DEBUG) {
    console.error(`[ai ${new Date().toISOString().slice(11, 19)}]`, ...parts);
  }
};

// Resolves/rejects like `promise`, but rejects with a TimeoutError after `ms`
// no matter what — even if the SDK ignores the abort signal.
export function withDeadline(promise, ms, onTimeout) {
  let timer;

  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      onTimeout();
      reject(Object.assign(new Error(`timed out after ${ms} ms`), { name: "TimeoutError" }));
    }, ms);
  });

  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

// Errors often carry a JSON body — pull out just the human message
export function readableMessage(raw) {
  try {
    return JSON.parse(raw)?.error?.message ?? raw;
  } catch {
    return raw;
  }
}

// The request took longer than our time limit (we cancelled it)
export function isTimeout(error) {
  return (
    error?.name === "TimeoutError" ||
    error?.name === "AbortError" ||
    error?.name === "APIUserAbortError" ||
    /aborted|timed? ?out/i.test(String(error?.message ?? ""))
  );
}

// The service answered "busy / temporarily down", or the connection dropped
export function isBusy(error) {
  const status = error?.status;
  const text = String(error?.message ?? "");

  return (
    (status >= 500 && status <= 504) ||
    /high demand|overloaded|UNAVAILABLE|fetch failed|ECONNRESET|socket hang up|Connection error/i.test(text)
  );
}

// "busy" or "too slow" after the main model AND the fallback model
export function unavailableError(serviceName, models, cause, timeoutMs) {
  const why = isTimeout(cause)
    ? `didn't answer within ${Math.round(timeoutMs / 1000)} s`
    : "is busy (high demand)";

  return new ProviderUnavailableError(
    `${serviceName} ${why} — tried ${models.join(" and ")}. Please try again in a few minutes.`,
    { cause, status: cause?.status }
  );
}

// Calls one model: retries "busy" answers after a short wait; gives up at once on a
// timeout (a model that hung once usually hangs again — better to switch models).
export async function withBusyRetries(callOnce, modelName, waits = BUSY_RETRY_WAITS_MS) {
  for (let retry = 0; ; retry++) {
    try {
      return await callOnce(modelName);
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

// Main model, then the fallback model when the main one is busy or too slow.
// toProviderError turns any other error (bad key, quota…) into one of ours.
// Returns { response, usedModel }.
export async function callWithFallback({
  serviceName,
  model,
  fallbackModel,
  timeoutMs,
  callModel,
  toProviderError,
}) {
  try {
    return { response: await callModel(model), usedModel: model };
  } catch (error) {
    if (!isBusy(error) && !isTimeout(error)) {
      throw toProviderError(error, model);
    }

    if (!fallbackModel || fallbackModel === model) {
      throw unavailableError(serviceName, [model], error, timeoutMs);
    }

    try {
      return { response: await callModel(fallbackModel), usedModel: fallbackModel };
    } catch (fallbackError) {
      throw isBusy(fallbackError) || isTimeout(fallbackError)
        ? unavailableError(serviceName, [model, fallbackModel], fallbackError, timeoutMs)
        : toProviderError(fallbackError, fallbackModel);
    }
  }
}
