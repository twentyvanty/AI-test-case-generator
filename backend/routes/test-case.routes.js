import express from "express";
import { authenticateToken } from "../middleware/auth.js";

import {
  deleteTestCase,
  draftTestCases,
  getTestCases,
  updateTestCase,
} from "../controllers/test-case.controller.js";

// Mounted at /api/projects/:projectId/requirements/:number
// (mergeParams gives us :projectId and :number)
const router = express.Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   parameters:
 *     TestCaseNumber:
 *       in: path
 *       name: testCaseNumber
 *       required: true
 *       schema:
 *         type: integer
 *       description: Test case number inside the requirement (1 = TC-0001)
 */

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/test-case-drafts:
 *   post:
 *     tags: [Test cases, AI generation]
 *     summary: Generate test cases for the scenarios that don't have any yet
 *     operationId: draftTestCases
 *     description: |
 *       Sends only the scenarios without test cases to the AI (generator + validator,
 *       up to 3 attempts), in small batches (at most 8 estimated test cases, usually
 *       2–3 scenarios), two batches at a time: one saved run per batch. Results are
 *       saved in scenario order, so TC numbers follow the scenarios.
 *       Existing test cases are never replaced: the new ones are added after them
 *       (TC-0013…) with status OPEN, and their scenarios become locked (D-029).
 *       A FAILED batch stops the generation after its pair; batches that passed keep
 *       their cases and the remaining scenarios can be generated again. About 1–2
 *       minutes per pair of batches on free AI models.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     responses:
 *       201:
 *         description: The run and all test cases afterwards
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestCaseDraftResult'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/test-case-drafts", authenticateToken, draftTestCases);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/test-cases:
 *   get:
 *     tags: [Test cases]
 *     summary: List the requirement's test cases
 *     operationId: getTestCases
 *     description: Active test cases (not in Recently deleted), in TC order.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     responses:
 *       200:
 *         description: The test cases
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestCase'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/test-cases", authenticateToken, getTestCases);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/test-cases/{testCaseNumber}:
 *   patch:
 *     tags: [Test cases]
 *     summary: Set a test case's status or edit it
 *     operationId: updateTestCase
 *     description: Send only the fields to change, e.g. just the status (Open / Pass / Fail).
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *       - $ref: '#/components/parameters/TestCaseNumber'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTestCaseRequest'
 *     responses:
 *       200:
 *         description: The updated test case
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestCase'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     tags: [Test cases]
 *     summary: Delete a test case (restorable for 7 days)
 *     operationId: deleteTestCase
 *     description: |
 *       Moves it to Recently deleted. When its scenario has no test cases left, the
 *       scenario unlocks again; with none left at all the requirement goes back to
 *       SCENARIOS_READY.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *       - $ref: '#/components/parameters/TestCaseNumber'
 *     responses:
 *       200:
 *         description: The requirement's status afterwards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [DRAFT, SCENARIOS_READY, CASES_READY, REPORTED]
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch("/test-cases/:testCaseNumber", authenticateToken, updateTestCase);
router.delete("/test-cases/:testCaseNumber", authenticateToken, deleteTestCase);

export default router;
