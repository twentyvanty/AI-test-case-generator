import { test } from "node:test";
import assert from "node:assert/strict";
import { readImageText } from "../document.service.js";
import { toImageReadRow } from "../image-read.service.js";
import { createMockProvider } from "../../ai/providers/mock.provider.js";

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
const mock = (failMode = "never") => ({
  vision: createMockProvider({ role: "vision", failMode }),
  validator: createMockProvider({ role: "validator", failMode }),
});

test("a successful image read becomes a log row with the text, model, time and tokens", async () => {
  const { text, run } = await readImageText("spec.png", PNG, mock());
  const row = toImageReadRow({ userId: 7, fileName: "spec.png", text, run });

  assert.equal(row.userId, 7);
  assert.equal(row.status, "PASSED");
  assert.equal(row.mimeType, "image/png");
  assert.equal(row.size, PNG.length);
  assert.equal(row.attempts, 1);
  assert.match(row.text, /Mock text read from spec\.png/);
  assert.equal(typeof row.seconds, "number");
  assert.ok(row.usage.generator.output > 0, "tokens are kept");
  assert.equal(row.errorMessage, null);
});

test("a failed image read is logged too, with the reason and no text", async () => {
  const { text, run } = await readImageText("spec.png", PNG, mock("busy"));
  const row = toImageReadRow({ userId: 7, fileName: "spec.png", text, run });

  assert.equal(row.status, "FAILED");
  assert.equal(row.text, null);
  assert.match(row.errorMessage, /busy/);
});
