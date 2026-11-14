import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readdir, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  SWEEP_GRACE_MS,
  defectImageRoot,
  detectImageType,
  imagePath,
  isStoredName,
  newStoredName,
  orphansToRemove,
  removeImageFile,
  saveImageFile,
  sweepOrphanImages,
} from "../defect-image-store.js";

// The first bytes of real files, padded to a plausible length
const pad = (bytes) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(64)]);
const PNG = pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG = pad([0xff, 0xd8, 0xff, 0xe0]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0x24, 0, 0, 0]), Buffer.from("WEBPVP8 "), Buffer.alloc(64)]);

test("screenshots are recognised by their content, not their name", () => {
  assert.equal(detectImageType(PNG), "image/png");
  assert.equal(detectImageType(JPEG), "image/jpeg");
  assert.equal(detectImageType(WEBP), "image/webp");

  // SVG can carry scripts; GIF isn't accepted; a text file renamed .png isn't an image
  assert.equal(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), null);
  assert.equal(detectImageType(pad([...Buffer.from("GIF89a")])), null);
  assert.equal(detectImageType(Buffer.from("just some text pretending to be a png")), null);
  assert.equal(detectImageType(Buffer.alloc(0)), null);
  assert.equal(detectImageType(Buffer.from([0x89, 0x50])), null);
  assert.equal(detectImageType("not a buffer"), null);
});

test("files are stored under our own random names, never the tester's", () => {
  const name = newStoredName("image/png");

  assert.match(name, /^[0-9a-f-]{36}\.png$/);
  assert.notEqual(newStoredName("image/png"), name);
  assert.match(newStoredName("image/jpeg"), /\.jpg$/);
  assert.match(newStoredName("image/webp"), /\.webp$/);

  assert.equal(isStoredName(name), true);
  for (const bad of ["../../etc/passwd", "evil.svg", `${name}/../x`, "screenshot.png", ""]) {
    assert.equal(isStoredName(bad), false, bad);
    assert.equal(imagePath(1, bad), null, bad);
  }
  assert.throws(() => imagePath(-1, name));
  assert.throws(() => imagePath(1.5, name));
});

test("the sweep removes folders of defects that are gone and old stray files only", () => {
  const now = 1_000_000_000_000;
  const old = now - SWEEP_GRACE_MS - 1;
  const fresh = now - 1000;
  const known = newStoredName("image/png");

  const result = orphansToRemove({
    folders: [
      { defectId: 7, files: [{ name: known, mtimeMs: old }] }, // defect gone → whole folder
      {
        defectId: 8,
        files: [
          { name: known, mtimeMs: old }, // known → kept
          { name: "stray.png", mtimeMs: old }, // unknown and old → removed
          { name: newStoredName("image/png"), mtimeMs: fresh }, // unknown but fresh: an upload in progress → kept
        ],
      },
    ],
    defectIds: new Set([8]),
    storedNames: new Map([[8, new Set([known])]]),
    now,
  });

  assert.deepEqual(result.folders, [7]);
  assert.deepEqual(result.files, [{ defectId: 8, name: "stray.png" }]);
});

test("files are saved, never overwritten, removed, and swept from disk", async (t) => {
  const dir = await mkdtemp(path.join(tmpdir(), "defect-images-"));
  const before = process.env.UPLOAD_DIR;
  process.env.UPLOAD_DIR = dir;
  t.after(async () => {
    process.env.UPLOAD_DIR = before;
    await rm(dir, { recursive: true, force: true });
  });

  const name = newStoredName("image/png");
  await saveImageFile(5, name, PNG);
  assert.deepEqual(await readdir(path.join(defectImageRoot(), "5")), [name]);
  await assert.rejects(() => saveImageFile(5, name, PNG), /EEXIST/);

  await removeImageFile(5, name);
  await removeImageFile(5, name); // already gone: fine
  assert.deepEqual(await readdir(path.join(defectImageRoot(), "5")), []);

  // A folder of a deleted defect, a stray old file, and a folder that isn't ours
  await saveImageFile(6, newStoredName("image/jpeg"), JPEG);
  await saveImageFile(5, newStoredName("image/png"), PNG); // unknown to the db, but fresh
  const stray = path.join(defectImageRoot(), "5", "leftover.tmp");
  await writeFile(stray, "x");
  const longAgo = new Date(Date.now() - SWEEP_GRACE_MS * 2);
  await utimes(stray, longAgo, longAgo);
  await mkdir(path.join(defectImageRoot(), "not-a-defect"));

  const db = {
    defect: { findMany: async () => [{ id: 5 }] },
    defectImage: { findMany: async () => [] },
  };
  const swept = await sweepOrphanImages(db);

  assert.deepEqual(swept, { folders: 1, files: 1 });
  assert.deepEqual((await readdir(defectImageRoot())).sort(), ["5", "not-a-defect"]);
  assert.equal((await readdir(path.join(defectImageRoot(), "5"))).length, 1, "the fresh unknown file stays");
});

test("nothing uploaded yet: the sweep has nothing to do", async (t) => {
  const before = process.env.UPLOAD_DIR;
  process.env.UPLOAD_DIR = path.join(tmpdir(), `no-uploads-${Date.now()}`);
  t.after(() => {
    process.env.UPLOAD_DIR = before;
  });

  assert.deepEqual(await sweepOrphanImages({}), { folders: 0, files: 0 });
});
