import { generateTestCasesFor } from "../services/generation.service.js";
import {
  deleteTestCase as deleteTestCaseService,
  getTestCases as getTestCasesService,
  updateTestCase as updateTestCaseService,
} from "../services/test-case.service.js";

import { validateUpdateTestCaseDto } from "../dto/test-case/update-test-case.dto.js";
import { sendKnownError } from "./errors.js";
import { readIds } from "./params.js";

// POST …/test-case-drafts: test cases for the scenarios that don't have any yet
export async function draftTestCases(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const result = await generateTestCasesFor(req.user, ids.projectId, ids.number);

    if (!result) {
      return res.status(404).json({
        message: "Requirement not found",
      });
    }

    res.status(201).json(result);
  } catch (error) {
    if (sendKnownError(res, error)) {
      return;
    }

    console.error("Generate test cases error:", error);

    res.status(500).json({
      message: "Failed to generate test cases",
    });
  }
}

export async function getTestCases(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const testCases = await getTestCasesService(req.user, ids.projectId, ids.number);

    if (!testCases) {
      return res.status(404).json({
        message: "Requirement not found",
      });
    }

    res.json(testCases);
  } catch (error) {
    console.error("Get test cases error:", error);

    res.status(500).json({
      message: "Failed to get test cases",
    });
  }
}

export async function updateTestCase(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number", "testCaseNumber"]);

    if (!ids) {
      return;
    }

    const validation = validateUpdateTestCaseDto(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const testCase = await updateTestCaseService(
      req.user,
      ids.projectId,
      ids.number,
      ids.testCaseNumber,
      req.body
    );

    if (!testCase) {
      return res.status(404).json({
        message: "Test case not found",
      });
    }

    res.json(testCase);
  } catch (error) {
    console.error("Update test case error:", error);

    res.status(500).json({
      message: "Failed to update test case",
    });
  }
}

export async function deleteTestCase(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number", "testCaseNumber"]);

    if (!ids) {
      return;
    }

    const result = await deleteTestCaseService(
      req.user,
      ids.projectId,
      ids.number,
      ids.testCaseNumber
    );

    if (!result) {
      return res.status(404).json({
        message: "Test case not found",
      });
    }

    // The requirement's status afterwards (SCENARIOS_READY when no cases are left)
    res.json(result);
  } catch (error) {
    console.error("Delete test case error:", error);

    res.status(500).json({
      message: "Failed to delete test case",
    });
  }
}
