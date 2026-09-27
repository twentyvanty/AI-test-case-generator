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

// Reads :projectId (and :number) from the URL. Answers 400 and returns null if invalid.
function readIds(req, res, { withNumber = true } = {}) {
  const projectId = Number(req.params.projectId);
  const number = Number(req.params.number);

  if (!Number.isInteger(projectId)) {
    res.status(400).json({
      message: "Invalid project id",
    });
    return null;
  }

  if (withNumber && !Number.isInteger(number)) {
    res.status(400).json({
      message: "Invalid requirement number",
    });
    return null;
  }

  return { projectId, number };
}

export async function getRequirements(req, res) {
  try {
    const ids = readIds(req, res, { withNumber: false });

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
    const ids = readIds(req, res, { withNumber: false });

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
    const ids = readIds(req, res);

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
    const ids = readIds(req, res);

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
    const ids = readIds(req, res);

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

// AI endpoints: always 201 with the saved run. A busy/over-quota AI is not a server
// error — the run's status is FAILED and errorMessage says why.

export async function suggestTechniques(req, res) {
  try {
    const ids = readIds(req, res);

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
    const ids = readIds(req, res);

    if (!ids) {
      return;
    }

    const result = await draftScenariosFor(req.user, ids.projectId, ids.number);

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
