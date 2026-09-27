import express from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/auth.js";
import { extractText } from "../controllers/document.controller.js";
import { MAX_FILE_BYTES, MAX_FILES } from "../services/document.service.js";

const router = express.Router();

// Files are kept in memory only long enough to read their text
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
}).array("files", MAX_FILES);

const UPLOAD_ERRORS = {
  LIMIT_FILE_SIZE: `A file is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB`,
  LIMIT_FILE_COUNT: `Upload at most ${MAX_FILES} files at a time`,
  LIMIT_UNEXPECTED_FILE: `Upload at most ${MAX_FILES} files, using the field name "files"`,
};

// Runs multer and turns its errors (too big, too many) into a 400 answer
function receiveFiles(req, res, next) {
  upload(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        message: UPLOAD_ERRORS[error.code] ?? error.message,
      });
    }

    next(error);
  });
}

/**
 * @openapi
 * /api/documents/extract-text:
 *   post:
 *     tags: [Documents]
 *     summary: Read the text of requirement documents
 *     operationId: extractDocumentText
 *     description: |
 *       Upload 1–5 files (PDF, DOCX, Markdown or TXT, up to 20 MB each) and get their
 *       plain text back. The files are not stored. A PDF that only contains scanned
 *       images returns empty text.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *             required: [files]
 *     responses:
 *       200:
 *         description: The text of each file, in upload order
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExtractedDocument'
 *       400:
 *         description: No files, unsupported type, too large, too many, or unreadable file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/extract-text", authenticateToken, receiveFiles, extractText);

export default router;
