import {
  createScenario as createScenarioService,
  deleteScenario as deleteScenarioService,
  getScenarioRuns as getScenarioRunsService,
  markRunReviewed as markRunReviewedService,
  restoreScenarioRun as restoreScenarioRunService,
  updateScenario as updateScenarioService,
} from "../services/scenario.service.js";

import { validateCreateScenarioDto } from "../dto/scenario/create-scenario.dto.js";
import { validateUpdateScenarioDto } from "../dto/scenario/update-scenario.dto.js";
import { sendKnownError } from "./errors.js";
import { readIds } from "./params.js";

export async function createScenario(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const validation = validateCreateScenarioDto(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const scenario = await createScenarioService(req.user, ids.projectId, ids.number, req.body);

    if (!scenario) {
      return res.status(404).json({
        message: "Requirement not found",
      });
    }

    res.status(201).json(scenario);
  } catch (error) {
    console.error("Create scenario error:", error);

    res.status(500).json({
      message: "Failed to create scenario",
    });
  }
}

export async function updateScenario(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number", "scenarioNumber"]);

    if (!ids) {
      return;
    }

    const validation = validateUpdateScenarioDto(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const scenario = await updateScenarioService(
      req.user,
      ids.projectId,
      ids.number,
      ids.scenarioNumber,
      req.body
    );

    if (!scenario) {
      return res.status(404).json({
        message: "Scenario not found",
      });
    }

    res.json(scenario);
  } catch (error) {
    if (sendKnownError(res, error)) {
      return;
    }

    console.error("Update scenario error:", error);

    res.status(500).json({
      message: "Failed to update scenario",
    });
  }
}

export async function deleteScenario(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number", "scenarioNumber"]);

    if (!ids) {
      return;
    }

    const result = await deleteScenarioService(
      req.user,
      ids.projectId,
      ids.number,
      ids.scenarioNumber
    );

    if (!result) {
      return res.status(404).json({
        message: "Scenario not found",
      });
    }

    // The requirement's status afterwards (DRAFT when no scenarios are left)
    res.json(result);
  } catch (error) {
    console.error("Delete scenario error:", error);

    res.status(500).json({
      message: "Failed to delete scenario",
    });
  }
}

export async function getScenarioRuns(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const runs = await getScenarioRunsService(req.user, ids.projectId, ids.number);

    if (!runs) {
      return res.status(404).json({
        message: "Requirement not found",
      });
    }

    res.json(runs);
  } catch (error) {
    console.error("Get scenario runs error:", error);

    res.status(500).json({
      message: "Failed to get scenario history",
    });
  }
}

export async function restoreScenarioRun(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number", "runId"]);

    if (!ids) {
      return;
    }

    const scenarios = await restoreScenarioRunService(
      req.user,
      ids.projectId,
      ids.number,
      ids.runId
    );

    if (scenarios === null) {
      return res.status(404).json({
        message: "Run not found",
      });
    }

    if (scenarios === false) {
      return res.status(400).json({
        message: "This run has no scenarios to restore",
      });
    }

    res.json(scenarios);
  } catch (error) {
    if (sendKnownError(res, error)) {
      return;
    }

    console.error("Restore scenario run error:", error);

    res.status(500).json({
      message: "Failed to restore scenarios",
    });
  }
}

// POST …/runs/:runId/reviewed: hides a run's "needs review" note
export async function markRunReviewed(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number", "runId"]);

    if (!ids) {
      return;
    }

    const run = await markRunReviewedService(req.user, ids.projectId, ids.number, ids.runId);

    if (!run) {
      return res.status(404).json({
        message: "Run not found",
      });
    }

    res.json(run);
  } catch (error) {
    console.error("Mark run reviewed error:", error);

    res.status(500).json({
      message: "Failed to mark the run as reviewed",
    });
  }
}
