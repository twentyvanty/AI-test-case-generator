import {
  DocumentError,
  extractDocumentText,
  isImageFile,
  readImageText,
} from "../services/document.service.js";
import { recordImageRead } from "../services/image-read.service.js";

// Browsers send non-English file names as UTF-8, but the upload parser reads
// them as Latin-1 — turn "à¸..." back into the real (e.g. Thai) name
function originalName(file) {
  return Buffer.from(file.originalname, "latin1").toString("utf8");
}

export async function extractText(req, res) {
  try {
    const files = req.files ?? [];

    if (files.length === 0) {
      return res.status(400).json({
        message: "Attach at least one file (field name: files)",
      });
    }

    // In parallel: reading an image with the AI can take up to a minute
    const documents = await Promise.all(
      files.map(async (file) => {
        const fileName = originalName(file);

        if (isImageFile(fileName)) {
          const { text, error, run } = await readImageText(fileName, file.buffer);
          // Logged whether it worked or not (D-033)
          await recordImageRead(req.user, { fileName, text, run });
          return { fileName, size: file.size, text, readBy: "ai", error };
        }

        return {
          fileName,
          size: file.size,
          text: await extractDocumentText(fileName, file.buffer),
          readBy: "code",
          error: null,
        };
      })
    );

    res.json(documents);
  } catch (error) {
    if (error instanceof DocumentError) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Extract text error:", error);

    res.status(500).json({
      message: "Failed to read the files",
    });
  }
}
