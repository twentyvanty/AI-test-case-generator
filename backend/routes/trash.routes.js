import express from "express";
import { authenticateToken } from "../middleware/auth.js";

import { deleteItemForever, getTrash, restoreItem } from "../controllers/trash.controller.js";

const router = express.Router();

/**
 * @openapi
 * components:
 *   parameters:
 *     TrashType:
 *       in: path
 *       name: type
 *       required: true
 *       schema:
 *         type: string
 *         enum: [requirement, scenario, testCase]
 *     TrashId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *       description: The item's database id (from GET /api/trash)
 */

/**
 * @openapi
 * /api/trash:
 *   get:
 *     tags: [Recently deleted]
 *     summary: List my recently deleted items
 *     operationId: listTrash
 *     description: |
 *       Deleted requirements, scenarios and test cases, kept for 7 days, most recently
 *       deleted first. A scenario deleted with its test cases is one item (testCaseCount).
 *     responses:
 *       200:
 *         description: The deleted items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TrashItem'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", authenticateToken, getTrash);

/**
 * @openapi
 * /api/trash/{type}/{id}/restore:
 *   post:
 *     tags: [Recently deleted]
 *     summary: Restore a deleted item
 *     operationId: restoreTrashItem
 *     description: |
 *       A requirement comes back with its scenarios, test cases and history. A scenario
 *       whose number was taken meanwhile gets the next free number.
 *     parameters:
 *       - $ref: '#/components/parameters/TrashType'
 *       - $ref: '#/components/parameters/TrashId'
 *     responses:
 *       200:
 *         description: Where the restored item is now
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestoredItem'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/:type/:id/restore", authenticateToken, restoreItem);

/**
 * @openapi
 * /api/trash/{type}/{id}:
 *   delete:
 *     tags: [Recently deleted]
 *     summary: Delete an item for good now
 *     operationId: deleteTrashItem
 *     parameters:
 *       - $ref: '#/components/parameters/TrashType'
 *       - $ref: '#/components/parameters/TrashId'
 *     responses:
 *       204:
 *         description: Deleted for good
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:type/:id", authenticateToken, deleteItemForever);

export default router;
