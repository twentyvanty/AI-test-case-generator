import express from "express";
import { authenticateToken } from "../middleware/auth.js";

import { getGenerations } from "../controllers/history.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/history/generations:
 *   get:
 *     tags: [History]
 *     summary: List my finished AI generations
 *     operationId: listGenerations
 *     description: |
 *       One item per click on Draft / Generate more / Generate test cases, across all
 *       my projects, newest first. Test cases are generated in batches (one run each);
 *       a click's runs are combined into one item. FAILED runs (nothing produced) and
 *       runs of deleted requirements aren't listed.
 *     parameters:
 *       - in: query
 *         name: kind
 *         schema:
 *           type: string
 *           enum: [SCENARIOS, TEST_CASES]
 *         description: Only this kind (default both)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 50
 *     responses:
 *       200:
 *         description: The generations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/GenerationHistoryItem'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/generations", authenticateToken, getGenerations);

export default router;
