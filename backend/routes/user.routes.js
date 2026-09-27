import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getMe } from "../controllers/user.controller.js";

const router = express.Router();

/**
 * @openapi
 * /api/me:
 *   get:
 *     tags: [Users]
 *     summary: Get the logged-in user
 *     operationId: getMe
 *     description: Returns the user linked to the access token, creating the user row on first use.
 *     responses:
 *       200:
 *         description: The current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Authentication and database connection successful
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/me", authenticateToken, getMe);

export default router;
