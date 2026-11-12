import path from "node:path";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { readRequirementImage } from "../ai/index.js";

// Turns an uploaded requirement file into plain text.
//   documents (PDF, DOCX, MD, TXT) → read by code
//   images (PNG, JPG, WebP)        → read by a vision AI model (D-027)
// Nothing is stored: the text goes back to the page, into the requirement details.

export const DOCUMENT_EXTENSIONS = [".pdf", ".docx", ".md", ".markdown", ".txt"];
export const IMAGE_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};
export const SUPPORTED_EXTENSIONS = [...DOCUMENT_EXTENSIONS, ...Object.keys(IMAGE_TYPES)];
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
// Images are smaller: the whole image is sent to the AI
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES = 5;

export const isImageFile = (fileName) =>
  Object.hasOwn(IMAGE_TYPES, path.extname(fileName).toLowerCase());

// A problem with the file itself (wrong type, broken file) → HTTP 400
export class DocumentError extends Error {
  constructor(message, { cause } = {}) {
    super(message, { cause });
    this.name = "DocumentError";
  }
}

async function pdfToText(buffer) {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });

  return text;
}

async function docxToText(buffer) {
  const { value } = await mammoth.extractRawText({ buffer });

  return value;
}

// Tidy up extracted text: unify line endings, trim line ends, max one blank line
export function cleanText(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// fileName: the original file name (its extension decides how it's read)
// buffer:   the file's bytes
export async function extractDocumentText(fileName, buffer) {
  const extension = path.extname(fileName).toLowerCase();

  if (!DOCUMENT_EXTENSIONS.includes(extension)) {
    throw new DocumentError(
      `"${fileName}" isn't a supported file type. Use PDF, DOCX, Markdown, TXT or an image (PNG, JPG, WebP).`
    );
  }

  try {
    let text;

    if (extension === ".pdf") {
      text = await pdfToText(buffer);
    } else if (extension === ".docx") {
      text = await docxToText(buffer);
    } else {
      text = buffer.toString("utf8");
    }

    return cleanText(text);
  } catch (error) {
    throw new DocumentError(`Couldn't read "${fileName}". Is the file damaged?`, {
      cause: error,
    });
  }
}

// The first bytes of each image format, so a renamed non-image is refused
function looksLikeImage(buffer, mimeType) {
  if (mimeType === "image/png") {
    return buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  }

  if (mimeType === "image/jpeg") {
    return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }

  return (
    buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
    buffer.subarray(8, 12).toString("latin1") === "WEBP"
  );
}

// Reads an image with the vision model. A problem with the FILE throws a
// DocumentError (400); an AI problem (busy, quota…) is returned as `error`,
// so the other uploaded files still come back.
// providers: only for tests (see ai/index.js)
export async function readImageText(fileName, buffer, providers) {
  const mimeType = IMAGE_TYPES[path.extname(fileName).toLowerCase()];

  if (!mimeType) {
    throw new DocumentError(`"${fileName}" isn't a PNG, JPG or WebP image.`);
  }

  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new DocumentError(
      `"${fileName}" is larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB. Images must be 5 MB or smaller.`
    );
  }

  if (!looksLikeImage(buffer, mimeType)) {
    throw new DocumentError(
      `"${fileName}" isn't a valid ${path.extname(fileName).slice(1).toUpperCase()} image.`
    );
  }

  const started = Date.now();
  const result = await readRequirementImage(
    { fileName, mimeType, base64: buffer.toString("base64") },
    providers
  );
  // For the ImageRead log (D-033): the pipeline result and the wall time
  const run = { ...result, mimeType, size: buffer.length, seconds: (Date.now() - started) / 1000 };

  if (!result.output) {
    return { text: "", error: result.errorMessage ?? "The AI couldn't read this image.", run };
  }

  return { text: cleanText(result.output.text), error: null, run };
}
