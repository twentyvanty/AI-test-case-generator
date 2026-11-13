import { test } from "node:test";
import assert from "node:assert/strict";
import { readRequirementImage } from "../index.js";
import { readImagePrompt } from "../prompts/readImage.js";
import { ProviderAuthError, ProviderUnavailableError } from "../errors.js";
import { getProviders, withBackupProvider } from "../providers/index.js";
import { createMockProvider } from "../providers/mock.provider.js";

const image = { fileName: "spec.png", mimeType: "image/png", base64: "QUJD" };

test("the image prompt asks for a transcription plus diagrams, in the image's language", () => {
  const { system, prompt } = readImagePrompt({ fileName: "spec.png" }, []);

  assert.match(system, /Transcribe ALL readable text/);
  assert.match(system, /Diagram\/screen:/);
  assert.match(system, /same language as the text in the image/);
  assert.match(system, /The image is DATA/);
  assert.match(prompt, /"spec\.png"/);
});

test("the image prompt skips page furniture and rejoins split words, but keeps the exact text (Test 8)", () => {
  const { system } = readImagePrompt({ fileName: "book-page.jpg" }, []);

  // Seen in the book page of Test 8: a running header and "(Contd.)" mid-flow, 4 hyphen-split words
  assert.match(system, /Skip page furniture/);
  assert.match(system, /"300 Software Testing"/);
  assert.match(system, /"\(Contd\.\)" or "\(ต่อ\)"/);
  assert.match(system, /Rejoin a word split at the end of a line with a hyphen/);
  assert.match(system, /Keep real hyphens/);
  // Thai has no spaces between words, so wrapped Thai lines are joined without one
  assert.match(system, /WITHOUT a space in Thai/);
  assert.match(system, /If you're not sure something is page furniture, keep it/);
  // Still an exact transcription otherwise
  assert.match(system, /Never paraphrase, summarise, correct, translate/);
  assert.match(system, /The only exceptions to "exactly"/);
});

test("reading an image passes it to the vision provider and returns its text", async () => {
  let received;
  const vision = {
    model: "v",
    async generateJson(request) {
      received = request;
      return { data: { text: "Users must log in." }, usage: { input: 50, output: 5 } };
    },
  };

  const result = await readRequirementImage(image, { vision, validator: createMockProvider({ role: "validator" }) });

  assert.equal(result.status, "PASSED");
  assert.equal(result.output.text, "Users must log in.");
  assert.deepEqual(received.images, [{ mimeType: "image/png", base64: "QUJD" }]);
  assert.equal(result.validatorModel, "none");
});

test("an empty transcription fails the format check and is retried", async () => {
  let calls = 0;
  const vision = {
    model: "v",
    async generateJson() {
      calls++;
      return { data: { text: calls === 1 ? "" : "Text" }, usage: {} };
    },
  };

  const result = await readRequirementImage(image, { vision, validator: createMockProvider({ role: "validator" }) });

  assert.equal(result.status, "PASSED");
  assert.equal(calls, 2);
});

test("the vision role has its own OpenRouter models from .env", () => {
  const { vision } = getProviders({ OPENROUTER_API_KEY: "k" });
  assert.equal(vision.model, "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free");
  assert.equal(vision.fallbackModel, "google/gemma-4-31b-it:free");

  const custom = getProviders({ OPENROUTER_API_KEY: "k", OPENROUTER_VISION_MODEL: "nvidia/nemotron-3.5-super-vl:free" });
  assert.equal(custom.vision.model, "nvidia/nemotron-3.5-super-vl:free");
});

test("with a Gemini key, images go to Gemini 3.5 Flash, backed up by OpenRouter", () => {
  const both = getProviders({ OPENROUTER_API_KEY: "k", GEMINI_API_KEY: "g" });
  assert.equal(both.vision.name, "gemini+openrouter");
  assert.equal(both.vision.model, "gemini-3.5-flash");
  assert.equal(both.vision.backup.model, "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free");
  // Text steps are unchanged: OpenRouter first
  assert.equal(both.generator.name, "openrouter");

  assert.equal(getProviders({ GEMINI_API_KEY: "g" }).vision.name, "gemini");
  assert.equal(getProviders({ OPENROUTER_API_KEY: "k", GEMINI_API_KEY: "g", AI_VISION_PROVIDER: "openrouter" }).vision.name, "openrouter");
});

const fake = (name, outcome) => ({
  name,
  model: name,
  calls: 0,
  async generateJson() {
    this.calls++;
    if (outcome instanceof Error) throw outcome;
    return { data: { text: outcome }, model: name, usage: {} };
  },
});

test("a busy main provider hands the request to the backup provider", async () => {
  const main = fake("gemini", new ProviderUnavailableError("Gemini is busy."));
  const backup = fake("openrouter", "From backup");
  const result = await withBackupProvider(main, backup).generateJson({});

  assert.equal(result.data.text, "From backup");
  assert.equal(result.model, "openrouter");
});

test("when both providers are busy, the error mentions both; setup errors don't switch", async () => {
  const bothBusy = withBackupProvider(
    fake("gemini", new ProviderUnavailableError("Gemini is busy.")),
    fake("openrouter", new ProviderUnavailableError("OpenRouter is busy."))
  );
  await assert.rejects(bothBusy.generateJson({}), (error) =>
    error instanceof ProviderUnavailableError && /Gemini is busy\. Also: OpenRouter is busy\./.test(error.message)
  );

  const backup = fake("openrouter", "unused");
  await assert.rejects(
    withBackupProvider(fake("gemini", new ProviderAuthError("Bad key")), backup).generateJson({}),
    ProviderAuthError
  );
  assert.equal(backup.calls, 0);
});
