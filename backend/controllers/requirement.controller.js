import {
  createRequirement as createRequirementService,
  deleteRequirement as deleteRequirementService,
  getRequirement as getRequirementService,
  getRequirements as getRequirementsService,
  updateRequirement as updateRequirementService,
} from "../services/requirement.service.js";
import {
  draftScenariosFor,
  suggestTechniquesFor,
} from "../services/generation.service.js";

import { validateCreateRequirementDto } from "../dto/requirement/create-requirement.dto.js";
import { validateUpdateRequirementDto } from "../dto/requirement/update-requirement.dto.js";
import { readIds } from "./params.js";

export async function getRequirements(req, res) {
  try {
    const ids = readIds(req, res, ["projectId"]);

    if (!ids) {
      return;
    }

    const requirements = await getRequirementsService(req.user, ids.projectId);

    if (!requirements) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.json(requirements);
  } catch (error) {
    console.error("Get requirements error:", error);

    res.status(500).json({
      message: "Failed to get requirements",
    });
  }
}

export async function createRequirement(req, res) {
  try {
    const ids = readIds(req, res, ["projectId"]);

    if (!ids) {
      return;
    }

    const validation = validateCreateRequirementDto(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const requirement = await createRequirementService(req.user, ids.projectId, req.body);

    if (!requirement) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.status(201).json(requirement);
  } catch (error) {
    console.error("Create requirement error:", error);

    res.status(500).json({
      message: "Failed to create requirement",
    });
  }
}

export async function getRequirement(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const requirement = await getRequirementService(req.user, ids.projectId, ids.number);

    if (!requirement) {
      return res.status(404).json({
        message: "Requirement not found",
      });
    }

    res.json(requirement);
  } catch (error) {
    console.error("Get requirement error:", error);

    res.status(500).json({
      message: "Failed to get requirement",
    });
  }
}

export async function updateRequirement(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const validation = validateUpdateRequirementDto(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const requirement = await updateRequirementService(
      req.user,
      ids.projectId,
      ids.number,
      req.body
    );

    if (!requirement) {
      return res.status(404).json({
        message: "Requirement not found",
      });
    }

    res.json(requirement);
  } catch (error) {
    console.error("Update requirement error:", error);

    res.status(500).json({
      message: "Failed to update requirement",
    });
  }
}

export async function deleteRequirement(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const deleted = await deleteRequirementService(req.user, ids.projectId, ids.number);

    if (!deleted) {
      return res.status(404).json({
        message: "Requirement not found",
      });
    }

    res.status(204).end();
  } catch (error) {
    console.error("Delete requirement error:", error);

    res.status(500).json({
      message: "Failed to delete requirement",
    });
  }
}

const DRAFT_MODES = ["replace", "more"];

// AI endpoints: always 201 with the saved run. A busy/over-quota AI is not a server
// error — the run's status is FAILED and errorMessage says why.

export async function suggestTechniques(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const run = await suggestTechniquesFor(req.user, ids.projectId, ids.number);

    if (!run) {
      return res.status(404).json({
        message: "Requirement not found",
      });
    }

    res.status(201).json(run);
  } catch (error) {
    console.error("Suggest techniques error:", error);

    res.status(500).json({
      message: "Failed to suggest techniques",
    });
  }
}

export async function draftScenarios(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    // "replace" (default): new scenarios replace the current ones; "more": added to them
    const mode = req.body?.mode ?? "replace";

    if (!DRAFT_MODES.includes(mode)) {
      return res.status(400).json({
        message: `mode must be one of: ${DRAFT_MODES.join(", ")}`,
      });
    }

    const result = await draftScenariosFor(req.user, ids.projectId, ids.number, mode);

    if (!result) {
      return res.status(404).json({
        message: "Requirement not found",
      });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Draft scenarios error:", error);

    res.status(500).json({
      message: "Failed to draft scenarios",
    });
  }
}
