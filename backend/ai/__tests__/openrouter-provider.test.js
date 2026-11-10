import { test } from "node:test";
import assert from "node:assert/strict";
import { createOpenRouterProvider, parseJsonAnswer } from "../providers/openrouter.provider.js";
import { getProviders } from "../providers/index.js";
import { draftScenarios } from "../index.js";
import {
  ProviderAuthError,
  ProviderError,
  ProviderQuotaError,
  ProviderUnavailableError,
} from "../errors.js";

const HANG = Symbol("hang");

// A fake OpenAI/OpenRouter client: answers per model name, records each request body
function fakeClient(answersByModel) {
  const calls = [];

  return {
    calls,
    chat: {
      completions: {
        async create(body, { signal }) {
          calls.push(body);
          const answer = answersByModel[body.model];

          if (answer === HANG) {
            return new Promise((resolve, reject) => {
              signal.addEventListener("abort", () =>
                reject(Object.assign(new Error("Request was aborted."), { name: "APIUserAbortError" }))
              );
            });
          }

          if (typeof answer === "function") {
            return answer(body);
          }

          if (answer instanceof Error) {
            throw answer;
          }

          return reply(JSON.stringify(answer));
        },
      },
    },
  };
}

const reply = (content, usage = { prompt_tokens: 120, completion_tokens: 30 }) => ({
  choices: [{ message: { content }, finish_reason: "stop" }],
  usage,
});
const apiError = (status, message) => Object.assign(new Error(message), { status });
const busy = () => apiError(503, "503 Provider returned error: model is overloaded");

const request = { system: "rules", prompt: "requirement", jsonSchema: { type: "object" } };
const make = (client, extra = {}) =>
  createOpenRouterProvider({ client, model: "main", fallbackModel: "backup", waits: [0, 0], ...extra });

test("asks for structured output (json_schema) and returns data, usage and the model", async () => {
  const client = fakeClient({ main: { ok: true } });

  const result = await make(client).generateJson(request);

  assert.deepEqual(result.data, { ok: true });
  assert.equal(result.model, "main");
  assert.deepEqual(result.usage, { input: 120, output: 30 });
  assert.equal(client.calls[0].response_format.type, "json_schema");
  assert.deepEqual(client.calls[0].response_format.json_schema.schema, request.jsonSchema);
  assert.equal(client.calls[0].provider.require_parameters, true);
});

test("a model without structured output is retried in JSON mode, with the schema in the prompt", async () => {
  const client = fakeClient({
    main: (body) =>
      body.response_format.type === "json_schema"
        ? Promise.reject(apiError(404, "No endpoints found that can handle the requested parameters. To learn more about provider routing, visit: https://openrouter.ai/docs/guides/routing/provider-selection"))
        : reply('```json\n{"ok":true}\n```'),
  });
  const provider = make(client);

  const first = await provider.generateJson(request);
  const second = await provider.generateJson(request);

  assert.deepEqual(first.data, { ok: true });
  assert.deepEqual(second.data, { ok: true });
  // json_schema tried once, then JSON mode remembered for this model
  assert.deepEqual(client.calls.map((body) => body.response_format.type), ["json_schema", "json_object", "json_object"]);
  assert.match(client.calls[1].messages[0].content, /JSON Schema exactly/);
});

test("a model without JSON mode either gets the schema in the prompt only", async () => {
  const unsupported = () => Promise.reject(apiError(404, "No endpoints found that can handle the requested parameters"));
  const client = fakeClient({
    main: (body) => (body.response_format ? unsupported() : reply('{"ok":true}')),
  });

  const result = await make(client).generateJson(request);

  assert.deepEqual(result.data, { ok: true });
  assert.deepEqual(
    client.calls.map((body) => body.response_format?.type ?? "none"),
    ["json_schema", "json_object", "none"]
  );
});

test("images are sent as data URLs next to the text", async () => {
  const client = fakeClient({ main: { text: "read" } });

  await make(client).generateJson({ ...request, images: [{ mimeType: "image/png", base64: "QUJD" }] });

  const content = client.calls[0].messages[1].content;
  assert.deepEqual(content[0], { type: "text", text: "requirement" });
  assert.deepEqual(content[1], { type: "image_url", image_url: { url: "data:image/png;base64,QUJD" } });
});

test("a model that can't read images gives a clear message instead of trying other JSON modes", async () => {
  const client = fakeClient({ main: apiError(404, "No endpoints found that support image input") });

  await assert.rejects(
    make(client).generateJson({ ...request, images: [{ mimeType: "image/png", base64: "QUJD" }] }),
    (error) => error instanceof ProviderAuthError && /can't read images.*OPENROUTER_VISION_MODEL/.test(error.message)
  );
  assert.equal(client.calls.length, 1);
});

test("busy → retried, then the fallback model answers", async () => {
  const client = fakeClient({ main: busy(), backup: { ok: true } });

  const result = await make(client).generateJson(request);

  assert.equal(result.model, "backup");
  assert.deepEqual(client.calls.map((body) => body.model), ["main", "main", "main", "backup"]);
});

test("a hanging model is cut off by the time limit and the fallback is used", async () => {
  const client = fakeClient({ main: HANG, backup: { ok: true } });

  const result = await make(client, { timeoutMs: 50 }).generateJson(request);

  assert.equal(result.model, "backup");
});

test("both models busy → ProviderUnavailableError naming OpenRouter and both models", async () => {
  const client = fakeClient({ main: busy(), backup: busy() });

  await assert.rejects(make(client).generateJson(request), (error) =>
    error instanceof ProviderUnavailableError && /OpenRouter is busy.*main and backup/.test(error.message)
  );
});

test("rate limit (429), no credits (402) and a bad key (401) stop at once without the fallback", async () => {
  for (const [status, ErrorType] of [[429, ProviderQuotaError], [402, ProviderQuotaError], [401, ProviderAuthError]]) {
    const client = fakeClient({ main: apiError(status, "nope"), backup: { ok: true } });

    await assert.rejects(make(client).generateJson(request), ErrorType);
    assert.deepEqual(client.calls.map((body) => body.model), ["main"]);
  }
});

test("a 429 from the model's busy host is retried and falls back; the account limit is not", async () => {
  const upstream = fakeClient({ main: apiError(429, "429 Provider returned error"), backup: { ok: true } });
  const result = await make(upstream).generateJson(request);

  assert.equal(result.model, "backup");
  assert.deepEqual(upstream.calls.map((body) => body.model), ["main", "main", "main", "backup"]);

  const account = fakeClient({ main: apiError(429, "Rate limit exceeded: free-models-per-day"), backup: { ok: true } });
  await assert.rejects(make(account).generateJson(request), ProviderQuotaError);
  assert.deepEqual(account.calls.map((body) => body.model), ["main"]);
});

test("an unknown model gives a clear message; moderation blocks are fatal", async () => {
  await assert.rejects(
    make(fakeClient({ main: apiError(404, "bad/model is not a valid model ID") })).generateJson(request),
    (error) => error instanceof ProviderAuthError && /OPENROUTER_\*_MODEL/.test(error.message)
  );
  await assert.rejects(
    make(fakeClient({ main: apiError(403, "flagged") })).generateJson(request),
    (error) => error instanceof ProviderError && error.fatal === true
  );
});

test("an error inside a 200 answer is treated like the HTTP error", async () => {
  const client = fakeClient({ main: () => ({ error: { code: 429, message: "Rate limit exceeded" } }) });

  await assert.rejects(make(client).generateJson(request), ProviderQuotaError);
});

test("text that isn't JSON → INVALID_JSON (so the pipeline retries)", async () => {
  const client = fakeClient({ main: () => reply("Sorry, I can't help with that.") });

  await assert.rejects(make(client).generateJson(request), (error) => error.code === "INVALID_JSON");
});

test("parseJsonAnswer accepts fences and surrounding text", () => {
  assert.deepEqual(parseJsonAnswer('{"a":1}'), { a: 1 });
  assert.deepEqual(parseJsonAnswer('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseJsonAnswer('Here you go: {"a":{"b":2}} — done'), { a: { b: 2 } });
  assert.throws(() => parseJsonAnswer("no json here"));
});

test("providers default to OpenRouter when its key is set, with different models", () => {
  const { generator, validator } = getProviders({ OPENROUTER_API_KEY: "k", GEMINI_API_KEY: "g" });

  assert.equal(generator.name, "openrouter");
  assert.equal(validator.name, "openrouter");
  assert.notEqual(generator.model, validator.model);
});

test("model names come from .env (paid models later = only an .env change)", () => {
  const { generator } = getProviders({
    OPENROUTER_API_KEY: "k",
    OPENROUTER_GENERATOR_MODEL: "anthropic/claude-sonnet-5",
    OPENROUTER_GENERATOR_FALLBACK_MODEL: "none",
  });

  assert.equal(generator.model, "anthropic/claude-sonnet-5");
  assert.equal(generator.fallbackModel, null);
});

test("pipeline works end to end through the OpenRouter provider", async () => {
  const scenarios = {
    scenarios: [{ title: "Age 17 rejected", description: "d", technique: "boundaryValue", priority: "high", estimatedCases: 3 }],
  };
  const pass = { status: "pass", issues: [] };
  const generator = make(fakeClient({ main: scenarios }));
  const validator = make(fakeClient({ main: { requirementCoverage: pass, techniqueCompliance: pass, rules: pass } }));

  const result = await draftScenarios(
    { requirementText: "Age must be 18 to 60.", techniques: ["boundaryValue"] },
    { generator, validator }
  );

  assert.equal(result.status, "PASSED");
  assert.equal(result.output.scenarios[0].title, "Age 17 rejected");
});
