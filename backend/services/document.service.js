import path from "node:path";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

// Turns an uploaded requirement document into plain text.
// Nothing is stored: the text goes back to the page, into the requirement details.

export const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".md", ".markdown", ".txt"];
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_FILES = 5;

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

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    throw new DocumentError(
      `"${fileName}" isn't a supported file type. Use PDF, DOCX, Markdown or TXT.`
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
