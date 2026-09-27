import {
  DocumentError,
  extractDocumentText,
} from "../services/document.service.js";

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

    const documents = [];

    for (const file of files) {
      const fileName = originalName(file);

      documents.push({
        fileName,
        size: file.size,
        text: await extractDocumentText(fileName, file.buffer),
      });
    }

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
