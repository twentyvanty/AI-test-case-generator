import { randomUUID } from "node:crypto";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Defect screenshots on disk (D-037). Files live under
//   UPLOAD_DIR/defects/<defectId>/<random uuid>.<png|jpg|webp>
// and are only ever served through the authenticated image endpoint; there's no
// public folder. The database holds their details (DefectImage).

export const MAX_DEFECT_IMAGES = 3;
export const MAX_DEFECT_IMAGE_BYTES = 5 * 1024 * 1024;

const backendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Read when used, so tests can point it at a temporary folder
export function defectImageRoot() {
  return path.join(path.resolve(process.env.UPLOAD_DIR || path.join(backendDir, "uploads")), "defects");
}

const EXTENSIONS = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp" };

// The image type from the file's first bytes, never from its name or the type
// the browser claims. Only PNG, JPEG and WebP: SVG can carry scripts, and GIF
// isn't needed for screenshots. null = not an accepted image.
export function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }

  return null;
}

// Names we create: a uuid + our own extension. Anything else (e.g. "../x") is
// never read or deleted.
const STORED_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp)$/;

export function newStoredName(mimeType) {
  return `${randomUUID()}${EXTENSIONS[mimeType]}`;
}

export const isStoredName = (name) => STORED_NAME.test(name);

function folderOf(defectId) {
  if (!Number.isInteger(defectId) || defectId <= 0) {
    throw new Error(`Invalid defect id: ${defectId}`);
  }

  return path.join(defectImageRoot(), String(defectId));
}

// Full path of a stored image, or null if the name isn't one of ours
export function imagePath(defectId, storedName) {
  return isStoredName(storedName) ? path.join(folderOf(defectId), storedName) : null;
}

export async function saveImageFile(defectId, storedName, buffer) {
  const file = imagePath(defectId, storedName);

  if (!file) {
    throw new Error(`Invalid stored name: ${storedName}`);
  }

  await mkdir(folderOf(defectId), { recursive: true });
  await writeFile(file, buffer, { flag: "wx" }); // never overwrite
}

// Missing files are fine (already gone)
export async function removeImageFile(defectId, storedName) {
  const file = imagePath(defectId, storedName);

  if (file) {
    await rm(file, { force: true });
  }
}

// A file this young may belong to an upload whose database row isn't written yet
export const SWEEP_GRACE_MS = 10 * 60 * 1000;

// What the sweep removes, decided without touching the disk (easy to test):
//   folders: [{ defectId, files: [{ name, mtimeMs }] }] as found on disk
//   defectIds: Set of defect ids that still exist
//   storedNames: Map defectId → Set of stored names the database knows
// Returns { folders: [defectId…], files: [{ defectId, name }…] }.
export function orphansToRemove({ folders, defectIds, storedNames, now }) {
  const result = { folders: [], files: [] };

  for (const folder of folders) {
    if (!defectIds.has(folder.defectId)) {
      result.folders.push(folder.defectId);
      continue;
    }

    const known = storedNames.get(folder.defectId) ?? new Set();

    for (const file of folder.files) {
      if (!known.has(file.name) && now - file.mtimeMs > SWEEP_GRACE_MS) {
        result.files.push({ defectId: folder.defectId, name: file.name });
      }
    }
  }

  return result;
}

async function foldersOnDisk() {
  let entries;

  try {
    entries = await readdir(defectImageRoot(), { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return []; // nothing uploaded yet
    }

    throw error;
  }

  const folders = [];

  for (const entry of entries) {
    const defectId = Number(entry.name);

    if (!entry.isDirectory() || !Number.isInteger(defectId) || defectId <= 0) {
      continue; // not one of ours: leave it alone
    }

    const names = await readdir(path.join(defectImageRoot(), entry.name));
    const files = [];

    for (const name of names) {
      const info = await stat(path.join(defectImageRoot(), entry.name, name));
      files.push({ name, mtimeMs: info.mtimeMs });
    }

    folders.push({ defectId, files });
  }

  return folders;
}

// Removes image files the database no longer knows: folders of defects deleted
// for good (directly, by the 7-day purge, or with their requirement, project or
// user, where the database cascade can't delete files) and stray files left by a
// failed upload. Returns how many folders and files were removed.
export async function sweepOrphanImages(db, now = Date.now()) {
  const folders = await foldersOnDisk();

  if (folders.length === 0) {
    return { folders: 0, files: 0 };
  }

  const ids = folders.map((folder) => folder.defectId);
  const [defects, images] = await Promise.all([
    db.defect.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    db.defectImage.findMany({ where: { defectId: { in: ids } }, select: { defectId: true, storedName: true } }),
  ]);

  const storedNames = new Map();

  for (const image of images) {
    if (!storedNames.has(image.defectId)) {
      storedNames.set(image.defectId, new Set());
    }

    storedNames.get(image.defectId).add(image.storedName);
  }

  const orphans = orphansToRemove({
    folders,
    defectIds: new Set(defects.map((defect) => defect.id)),
    storedNames,
    now,
  });

  for (const defectId of orphans.folders) {
    await rm(folderOf(defectId), { recursive: true, force: true });
  }

  for (const { defectId, name } of orphans.files) {
    await rm(path.join(folderOf(defectId), name), { force: true });
  }

  return { folders: orphans.folders.length, files: orphans.files.length };
}
