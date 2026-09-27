import express from "express";
import { authenticateToken } from "../middleware/auth.js";

import {
  createRequirement,
  deleteRequirement,
  draftScenarios,
  getRequirement,
  getRequirements,
  suggestTechniques,
  updateRequirement,
} from "../controllers/requirement.controller.js";

// Mounted at /api/projects/:projectId/requirements (mergeParams gives us :projectId)
const router = express.Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   parameters:
 *     ProjectId:
 *       in: path
 *       name: projectId
 *       required: true
 *       schema:
 *         type: integer
 *       description: Project id
 *     RequirementNumber:
 *       in: path
 *       name: number
 *       required: true
 *       schema:
 *         type: integer
 *       description: Requirement number inside the project (1 = REQ-0001)
 */

/**
 * @openapi
 * /api/projects/{projectId}/requirements:
 *   get:
 *     tags: [Requirements]
 *     summary: List a project's requirements
 *     operationId: listRequirements
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *     responses:
 *       200:
 *         description: Requirements, ordered by number
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Requirement'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", authenticateToken, getRequirements);

/**
 * @openapi
 * /api/projects/{projectId}/requirements:
 *   post:
 *     tags: [Requirements]
 *     summary: Create a requirement
 *     operationId: createRequirement
 *     description: Gets the next number in the project (REQ-0001, REQ-0002, …) and status DRAFT.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRequirementRequest'
 *     responses:
 *       201:
 *         description: The created requirement
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Requirement'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/", authenticateToken, createRequirement);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}:
 *   get:
 *     tags: [Requirements]
 *     summary: Get a requirement with its scenarios
 *     operationId: getRequirement
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     responses:
 *       200:
 *         description: The requirement, its scenarios and the latest scenario draft run
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RequirementDetail'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:number", authenticateToken, getRequirement);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}:
 *   patch:
 *     tags: [Requirements]
 *     summary: Edit a requirement
 *     operationId: updateRequirement
 *     description: Send only the fields to change. Existing scenarios are kept.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRequirementRequest'
 *     responses:
 *       200:
 *         description: The updated requirement
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Requirement'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch("/:number", authenticateToken, updateRequirement);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}:
 *   delete:
 *     tags: [Requirements]
 *     summary: Delete a requirement
 *     operationId: deleteRequirement
 *     description: Also deletes its generation history, scenarios and test cases.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     responses:
 *       204:
 *         description: Deleted
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:number", authenticateToken, deleteRequirement);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/technique-suggestions:
 *   post:
 *     tags: [AI generation]
 *     summary: Ask the AI which testing techniques fit
 *     operationId: suggestTechniques
 *     description: |
 *       Uses the saved requirement text. The result is saved as a GenerationRun
 *       (kind TECHNIQUE_SUGGESTION). If the AI is busy or over its limit, the run's
 *       status is FAILED and errorMessage explains why (still HTTP 201).
 *       Can take up to a minute.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     responses:
 *       201:
 *         description: The saved run; output.suggestions holds the techniques and reasons
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenerationRun'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/:number/technique-suggestions", authenticateToken, suggestTechniques);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/scenario-drafts:
 *   post:
 *     tags: [AI generation]
 *     summary: Draft test scenarios with the AI
 *     operationId: draftScenarios
 *     description: |
 *       Uses the saved requirement text and techniques (an empty technique list lets
 *       the AI choose). The result is saved as a GenerationRun (kind SCENARIOS).
 *
 *       - **PASSED / NEEDS_REVIEW**: the new scenarios replace the old ones and the
 *         requirement's status becomes SCENARIOS_READY.
 *       - **FAILED** (AI busy, over its limit…): the old scenarios are kept and
 *         errorMessage explains why. Still HTTP 201.
 *
 *       Can take one to a few minutes.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     responses:
 *       201:
 *         description: The saved run and the requirement's scenarios after it
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 run:
 *                   $ref: '#/components/schemas/GenerationRun'
 *                 scenarios:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Scenario'
 *               required: [run, scenarios]
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/:number/scenario-drafts", authenticateToken, draftScenarios);

export default router;
