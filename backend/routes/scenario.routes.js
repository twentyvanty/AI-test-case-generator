import express from "express";
import { authenticateToken } from "../middleware/auth.js";

import {
  createScenario,
  deleteScenario,
  getScenarioRuns,
  restoreScenarioRun,
  updateScenario,
} from "../controllers/scenario.controller.js";

// Mounted at /api/projects/:projectId/requirements/:number
// (mergeParams gives us :projectId and :number)
const router = express.Router({ mergeParams: true });

/**
 * @openapi
 * components:
 *   parameters:
 *     ScenarioNumber:
 *       in: path
 *       name: scenarioNumber
 *       required: true
 *       schema:
 *         type: integer
 *       description: Scenario number inside the requirement (1 = SC-01)
 *     RunId:
 *       in: path
 *       name: runId
 *       required: true
 *       schema:
 *         type: integer
 *       description: GenerationRun id (from the scenario history)
 */

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/scenarios:
 *   post:
 *     tags: [Scenarios]
 *     summary: Add a scenario by hand
 *     operationId: createScenario
 *     description: Numbered after the current scenarios. Source MANUAL, priority MEDIUM unless given.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateScenarioRequest'
 *     responses:
 *       201:
 *         description: The new scenario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Scenario'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/scenarios", authenticateToken, createScenario);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/scenarios/{scenarioNumber}:
 *   patch:
 *     tags: [Scenarios]
 *     summary: Edit a scenario
 *     operationId: updateScenario
 *     description: Send only the fields to change (e.g. just the priority).
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *       - $ref: '#/components/parameters/ScenarioNumber'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateScenarioRequest'
 *     responses:
 *       200:
 *         description: The updated scenario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Scenario'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch("/scenarios/:scenarioNumber", authenticateToken, updateScenario);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/scenarios/{scenarioNumber}:
 *   delete:
 *     tags: [Scenarios]
 *     summary: Delete a scenario (restorable for 7 days)
 *     operationId: deleteScenario
 *     description: |
 *       Moves the scenario and its test cases to Recently deleted (see /api/trash).
 *       When no scenarios are left, the requirement's status goes back to DRAFT.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *       - $ref: '#/components/parameters/ScenarioNumber'
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
router.delete("/scenarios/:scenarioNumber", authenticateToken, deleteScenario);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/scenario-runs:
 *   get:
 *     tags: [Scenarios]
 *     summary: Scenario draft history (last 10)
 *     operationId: listScenarioRuns
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     responses:
 *       200:
 *         description: Newest first
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ScenarioRun'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/scenario-runs", authenticateToken, getScenarioRuns);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/scenario-runs/{runId}/restore:
 *   post:
 *     tags: [Scenarios]
 *     summary: Restore the scenarios of an earlier draft
 *     operationId: restoreScenarioRun
 *     description: |
 *       Replaces the current scenarios (including manual edits) with the list saved
 *       right after that run. FAILED runs have nothing to restore (400).
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *       - $ref: '#/components/parameters/RunId'
 *     responses:
 *       200:
 *         description: The scenarios after restoring
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Scenario'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/scenario-runs/:runId/restore", authenticateToken, restoreScenarioRun);

export default router;
