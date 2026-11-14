import express from "express";
import { authenticateToken } from "../middleware/auth.js";

import {
  createDefect,
  deleteDefect,
  getDefects,
  updateDefect,
} from "../controllers/defect.controller.js";

// Defects found while testing (Slice 6), under the Step 3 table.
// Mounted at /api/projects/:projectId/requirements/:number
// (mergeParams gives us :projectId and :number)
const router = express.Router({ mergeParams: true });

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
 *     description: Moves it to Recently deleted. It keeps its number when restored.
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

export default router;
