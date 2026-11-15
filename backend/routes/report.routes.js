import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { finalizeReport, getReport, getReportVersion, saveConclusion } from "../controllers/report.controller.js";

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
 *       - Also returns the tester's draft `conclusion`, the latest `finalized` version,
 *         every version (`versions`, newest first) and `changedSinceFinalized`: the
 *         content (not the date or token counts) or the conclusion differs from the
 *         latest finalized version.
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

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/report:
 *   patch:
 *     tags: [Report]
 *     summary: Save the tester's conclusion (draft)
 *     operationId: saveReportConclusion
 *     description: Saved while writing; finalizing copies it into the report version.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conclusion: { type: string, maxLength: 5000, example: "Ready for release once DEF-2 is retested." }
 *             required: [conclusion]
 *     responses:
 *       200:
 *         description: The report, as GET returns it
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
 */
router.patch("/report", authenticateToken, saveConclusion);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/report/finalize:
 *   post:
 *     tags: [Report]
 *     summary: Finalize the report (save it as a new version)
 *     operationId: finalizeReport
 *     description: |
 *       Saves the live report with the conclusion as the next version (1, 2, 3…;
 *       earlier versions never change) and sets the requirement to REPORTED. The
 *       snapshot is the report's data at that moment, so it can be shown again exactly.
 *
 *       - **409** when there are no test cases, while a generation runs (D-039), or when
 *         the suggested verdict is NOT_READY and `acceptOpenRisks` isn't true (the page
 *         asks "Finalize with open risks?").
 *       - REPORTED stays when the data changes later (the report then shows
 *         `changedSinceFinalized`); it drops back only when no test cases are left.
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conclusion:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Saved first, as with PATCH; leave out to use the saved one
 *               acceptOpenRisks:
 *                 type: boolean
 *                 default: false
 *                 description: Needed when the suggested verdict is NOT_READY
 *     responses:
 *       201:
 *         description: The report afterwards, as GET returns it
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
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post("/report/finalize", authenticateToken, finalizeReport);

/**
 * @openapi
 * /api/projects/{projectId}/requirements/{number}/report/versions/{version}:
 *   get:
 *     tags: [Report]
 *     summary: One finalized version of the report, exactly as it was saved
 *     operationId: getReportVersion
 *     parameters:
 *       - $ref: '#/components/parameters/ProjectId'
 *       - $ref: '#/components/parameters/RequirementNumber'
 *       - name: version
 *         in: path
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: The version and its snapshot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version: { type: integer }
 *                 finalizedAt: { type: string, format: date-time }
 *                 verdict: { type: string, enum: [READY, NOT_READY] }
 *                 withOpenRisks: { type: boolean, description: "Any risks to confirm were listed" }
 *                 conclusion: { type: string }
 *                 snapshot:
 *                   allOf: [{ $ref: '#/components/schemas/TestReport' }]
 *                   description: The report as it was, with its conclusion
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/report/versions/:version", authenticateToken, getReportVersion);

export default router;
