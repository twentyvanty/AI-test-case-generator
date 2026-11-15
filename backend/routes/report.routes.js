import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getReport } from "../controllers/report.controller.js";

// The test completion report (Slice 6c, D-040).
// Mounted at /api/projects/:projectId/requirements/:number
const router = express.Router({ mergeParams: true });

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/report:
 *   get:
 *     tags: [Report]
 *     summary: The live test completion report for a requirement
 *     operationId: getReport
 *     description: |
 *       Built from the current data every time (D-040), modelled on ISO/IEC/IEEE
 *       29119-3 and ISTQB: header, summary with a **suggested verdict**, results per
 *       scenario, traceability (scenario → test cases → defects), defects by
 *       severity × status, **risks to confirm** and AI generation info.
 *
 *       - **Verdict** (strict): READY only when every test case was run, none failed
 *         and no Critical / Major defect is open; otherwise NOT_READY with reasons
 *         (NO_TEST_CASES, NOT_RUN, FAILED, OPEN_SERIOUS_DEFECTS).
 *       - **Risks** (only those that apply): FAILED_WITHOUT_DEFECT, NOT_RUN,
 *         SCENARIOS_WITHOUT_CASES (`outOfDate` when test cases exist), UNREVIEWED_AI_NOTES,
 *         ASSUMED_RULE (cases whose precondition states a guessed rule, D-036).
 *       - Values are codes (statuses, severities, technique keys), so the page
 *         translates them. Test case status OPEN = not run yet.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     responses:
 *       200:
 *         description: The report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestReport'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/report", authenticateToken, getReport);

export default router;
