import { test } from "node:test";
import assert from "node:assert/strict";
import { createGeminiProvider } from "../providers/gemini.provider.js";
import { runPipeline } from "../orchestrator.js";
import {
  ProviderAuthError,
  ProviderQuotaError,
  ProviderUnavailableError,
} from "../errors.js";

const HANG = Symbol("hang");

// A fake Google client: answers per model name, records which models were called
function fakeClient(answersByModel) {
  const calls = [];

  return {
    calls,
    models: {
      async generateContent({ model, config }) {
        calls.push({ model, config });
        const answer = answersByModel[model];

        if (answer === HANG) {
          // Never answers — only our time limit (abortSignal) ends the wait
          return new Promise((resolve, reject) => {
            config.abortSignal.addEventListener("abort", () => reject(config.abortSignal.reason));
          });
        }

        if (typeof answer === "function") {
          return answer(); // e.g. fail the first call, succeed the second
        }

        if (answer instanceof Error) {
          throw answer;
        }

        return {
          text: JSON.stringify(answer),
          usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, thoughtsTokenCount: 5 },
        };
      },
    },
  };
}

const apiError = (status, message) => Object.assign(new Error(message), { status });
const busy = () => apiError(503, "This model is currently experiencing high demand.");

const request = { system: "s", prompt: "p", jsonSchema: { type: "object" } };

test("a busy model is retried after a wait, and can then succeed", async () => {
  let calls = 0;
  const client = fakeClient({
    main: async () => {
      calls++;
      if (calls < 3) throw busy();
      return { text: JSON.stringify({ ok: true }), usageMetadata: {} };
    },
  });
  const provider = createGeminiProvider({ waits: [0, 0], model: "main", fallbackModel: "backup", client });

  const result = await provider.generateJson(request);

  assert.equal(result.model, "main");
  assert.deepEqual(client.calls.map((call) => call.model), ["main", "main", "main"]);
});

test("a model that hangs is cut off by the time limit and the fallback is used", async () => {
  const client = fakeClient({ main: HANG, backup: { ok: true } });
  const provider = createGeminiProvider({
    waits: [0, 0],
    timeoutMs: 50,
    model: "main",
    fallbackModel: "backup",
    client,
  });

  const started = Date.now();
  const result = await provider.generateJson(request);

  assert.equal(result.model, "backup");
  assert.ok(Date.now() - started < 2000, "gave up on the hanging model quickly");
  // a hang is not retried on the same model
  assert.deepEqual(client.calls.map((call) => call.model), ["main", "backup"]);
});

test("the time limit holds even if the SDK ignores the abort signal", async () => {
  // A request that never ends and never listens to abort
  const client = fakeClient({ main: () => new Promise(() => {}), backup: { ok: true } });
  const provider = createGeminiProvider({
    waits: [0, 0],
    timeoutMs: 50,
    model: "main",
    fallbackModel: "backup",
    client,
  });

  const started = Date.now();
  const result = await provider.generateJson(request);

  assert.equal(result.model, "backup");
  assert.ok(Date.now() - started < 2000);
});

test("both models hanging → ProviderUnavailableError mentioning the time limit", async () => {
  const client = fakeClient({ main: HANG, backup: HANG });
  const provider = createGeminiProvider({
    waits: [0, 0],
    timeoutMs: 50,
    model: "main",
    fallbackModel: "backup",
    client,
  });

  await assert.rejects(provider.generateJson(request), (error) => {
    assert.ok(error instanceof ProviderUnavailableError);
    assert.match(error.message, /didn't answer within 0 s/);
    return true;
  });
});

test("returns data, token usage (thinking counts as output) and the model used", async () => {
  const provider = createGeminiProvider({ waits: [0, 0], model: "main", client: fakeClient({ main: { ok: 1 } }) });

  const result = await provider.generateJson(request);

  assert.deepEqual(result.data, { ok: 1 });
  assert.deepEqual(result.usage, { input: 100, output: 25 });
  assert.equal(result.model, "main");
});

test("switches to the fallback model when the main one is still busy", async () => {
  const client = fakeClient({ main: busy(), backup: { ok: true } });
  const provider = createGeminiProvider({ waits: [0, 0], model: "main", fallbackModel: "backup", client });

  const result = await provider.generateJson(request);

  // main: 1 call + 2 busy retries, then the fallback
  assert.deepEqual(client.calls.map((call) => call.model), ["main", "main", "main", "backup"]);
  assert.equal(result.model, "backup");
});

test("both models busy → ProviderUnavailableError with a clear message", async () => {
  const client = fakeClient({ main: busy(), backup: busy() });
  const provider = createGeminiProvider({ waits: [0, 0], model: "main", fallbackModel: "backup", client });

  await assert.rejects(provider.generateJson(request), (error) => {
    assert.ok(error instanceof ProviderUnavailableError);
    assert.equal(error.fatal, true);
    assert.match(error.message, /busy.*tried main and backup/);
    return true;
  });
});

test("no fallback configured → busy error straight away", async () => {
  const client = fakeClient({ main: busy() });
  const provider = createGeminiProvider({ waits: [0, 0], model: "main", client });

  await assert.rejects(provider.generateJson(request), ProviderUnavailableError);
  assert.equal(client.calls.length, 3, "1 call + 2 busy retries, no fallback");
});

test("quota and bad-key errors don't try the fallback", async () => {
  for (const [error, type] of [
    [apiError(429, "RESOURCE_EXHAUSTED"), ProviderQuotaError],
    [apiError(400, "API key not valid. API_KEY_INVALID"), ProviderAuthError],
  ]) {
    const client = fakeClient({ main: error, backup: { ok: true } });
    const provider = createGeminiProvider({ waits: [0, 0], model: "main", fallbackModel: "backup", client });

    await assert.rejects(provider.generateJson(request), type);
    assert.equal(client.calls.length, 1);
  }
});

test("an invalid request (400) is not retried", async () => {
  const client = fakeClient({ main: apiError(400, "Request contains an invalid argument.") });
  const provider = createGeminiProvider({ waits: [0, 0], model: "main", fallbackModel: "backup", client });

  const result = await runPipeline({
    kind: "SCENARIOS",
    input: { requirementText: "Age must be 18 to 60.", techniques: [] },
    generator: provider,
    validator: provider,
  });

  assert.equal(result.status, "FAILED");
  assert.equal(result.attempts, 1);
  assert.equal(client.calls.length, 1);
});

test("pipeline: busy servers stop after 1 attempt instead of using up the 3 quality retries", async () => {
  const client = fakeClient({ main: busy(), backup: busy() });
  const generator = createGeminiProvider({ waits: [0, 0], model: "main", fallbackModel: "backup", client });

  const result = await runPipeline({
    kind: "SCENARIOS",
    input: { requirementText: "Age must be 18 to 60.", techniques: [] },
    generator,
    validator: generator,
  });

  assert.equal(result.status, "FAILED");
  assert.equal(result.attempts, 1);
  assert.match(result.errorMessage, /try again in a few minutes/);
});

test("pipeline: records the fallback model that actually answered", async () => {
  const scenarios = {
    scenarios: [{ title: "Age 17 rejected", description: "d", technique: "boundaryValue", estimatedCases: 3 }],
  };
  const report = {
    requirementCoverage: { status: "pass", issues: [] },
    techniqueCompliance: { status: "pass", issues: [] },
    rules: { status: "pass", issues: [] },
  };

  const result = await runPipeline({
    kind: "SCENARIOS",
    input: { requirementText: "Age must be 18 to 60.", techniques: [] },
    generator: createGeminiProvider({
      waits: [0, 0],
      model: "main",
      fallbackModel: "backup",
      client: fakeClient({ main: busy(), backup: scenarios }),
    }),
    validator: createGeminiProvider({ waits: [0, 0], model: "checker", client: fakeClient({ checker: report }) }),
  });

  assert.equal(result.status, "PASSED");
  assert.equal(result.generatorModel, "backup");
  assert.equal(result.validatorModel, "checker");
});
