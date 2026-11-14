import express from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/auth.js";

import {
  createDefect,
  deleteDefect,
  deleteDefectImage,
  getDefectImage,
  getDefects,
  updateDefect,
  uploadDefectImages,
} from "../controllers/defect.controller.js";
import { MAX_DEFECT_IMAGE_BYTES, MAX_DEFECT_IMAGES } from "../services/defect-image-store.js";

// Defects found while testing (Slice 6), under the Step 3 table.
// Mounted at /api/projects/:projectId/requirements/:number
// (mergeParams gives us :projectId and :number)
const router = express.Router({ mergeParams: true });

// Screenshots are held in memory, checked by content, then written to disk (D-037)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DEFECT_IMAGE_BYTES, files: MAX_DEFECT_IMAGES },
}).array("files", MAX_DEFECT_IMAGES);

const UPLOAD_ERRORS = {
  LIMIT_FILE_SIZE: `A screenshot is larger than ${MAX_DEFECT_IMAGE_BYTES / 1024 / 1024} MB`,
  LIMIT_FILE_COUNT: `A defect can have at most ${MAX_DEFECT_IMAGES} screenshots`,
  LIMIT_UNEXPECTED_FILE: `Send at most ${MAX_DEFECT_IMAGES} images in the form field "files"`,
};

// Runs multer and turns its errors (too big, too many) into a 400 answer
function receiveImages(req, res, next) {
  upload(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({ message: UPLOAD_ERRORS[error.code] ?? error.message });
    }

    next(error);
  });
}

/**
 * @openapi
 * components:
 *   parameters:
 *     DefectNumber:
 *       in: path
 *       name: defectNumber
 *       required: true
 *       schema:
 *         type: integer
 *       description: Defect number inside the requirement (1 = DEF-1)
 *     DefectImageId:
 *       in: path
 *       name: imageId
 *       required: true
 *       schema:
 *         type: integer
 *       description: Screenshot id (from the defect's images list)
 */

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/defects:
 *   get:
 *     tags: [Defects]
 *     summary: List the requirement's defects
 *     operationId: getDefects
 *     description: Active defects (not in Recently deleted), in DEF order.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     responses:
 *       200:
 *         description: The defects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Defect'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   post:
 *     tags: [Defects]
 *     summary: Log a defect
 *     operationId: createDefect
 *     description: |
 *       Only the title is required. Numbered DEF-1, DEF-2… per requirement, never
 *       reused. Defaults: severity MAJOR, priority MEDIUM, status OPEN, opened today.
 *       A linked test case must be an active test case of this requirement (400 if
 *       not). Status CLOSED without closedOn sets closedOn to today; closedOn can't be
 *       before openedOn (400).
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDefectRequest'
 *     responses:
 *       201:
 *         description: The new defect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Defect'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/defects", authenticateToken, getDefects);
router.post("/defects", authenticateToken, createDefect);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/defects/{defectNumber}:
 *   patch:
 *     tags: [Defects]
 *     summary: Edit a defect
 *     operationId: updateDefect
 *     description: |
 *       Send only the fields to change. testCaseNumber null removes the link.
 *       Moving back to OPEN or IN_PROGRESS clears closedOn (unless closedOn is sent);
 *       CLOSED without a closedOn sets it to today.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *       - $ref: '#/components/parameters/DefectNumber'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDefectRequest'
 *     responses:
 *       200:
 *         description: The updated defect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Defect'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     tags: [Defects]
 *     summary: Delete a defect (restorable for 7 days)
 *     operationId: deleteDefect
 *     description: Moves it to Recently deleted, with its screenshots. It keeps its number when restored; its screenshot files are removed only when it is deleted for good.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *       - $ref: '#/components/parameters/DefectNumber'
 *     responses:
 *       204:
 *         description: Moved to Recently deleted
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch("/defects/:defectNumber", authenticateToken, updateDefect);
router.delete("/defects/:defectNumber", authenticateToken, deleteDefect);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/defects/{defectNumber}/images:
 *   post:
 *     tags: [Defects]
 *     summary: Attach screenshots to a defect
 *     operationId: uploadDefectImages
 *     description: |
 *       1 to 3 images in the form field `files`; a defect has at most 3 in total.
 *       PNG, JPG or WebP, at most 5 MB each, checked by the file's content (not its
 *       name): SVG, GIF and other files are refused (400). Stored on the server,
 *       served only through the endpoint below (D-037).
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *       - $ref: '#/components/parameters/DefectNumber'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 maxItems: 3
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: The defect with its screenshots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Defect'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/defects/:defectNumber/images", authenticateToken, receiveImages, uploadDefectImages);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/defects/{defectNumber}/images/{imageId}:
 *   get:
 *     tags: [Defects]
 *     summary: View a screenshot
 *     operationId: getDefectImage
 *     description: |
 *       The image file, only for the defect's owner (404 for anyone else). Sent with
 *       `X-Content-Type-Options: nosniff` and `Cache-Control: private, no-store`. The
 *       browser needs the login token, so the frontend fetches it rather than using
 *       a plain image link.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *       - $ref: '#/components/parameters/DefectNumber'
 *       - $ref: '#/components/parameters/DefectImageId'
 *     responses:
 *       200:
 *         description: The image
 *         content:
 *           image/png: {}
 *           image/jpeg: {}
 *           image/webp: {}
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     tags: [Defects]
 *     summary: Remove a screenshot
 *     operationId: deleteDefectImage
 *     description: Removes it for good, with its file (screenshots don't go to Recently deleted on their own).
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *       - $ref: '#/components/parameters/DefectNumber'
 *       - $ref: '#/components/parameters/DefectImageId'
 *     responses:
 *       200:
 *         description: The defect with its remaining screenshots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Defect'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/defects/:defectNumber/images/:imageId", authenticateToken, getDefectImage);
router.delete("/defects/:defectNumber/images/:imageId", authenticateToken, deleteDefectImage);

export default router;
