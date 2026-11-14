import {
  createDefect as createDefectService,
  deleteDefect as deleteDefectService,
  getDefects as getDefectsService,
  updateDefect as updateDefectService,
} from "../services/defect.service.js";

import { validateCreateDefectDto, validateUpdateDefectDto } from "../dto/defect/defect.dto.js";
import { sendKnownError } from "./errors.js";
import { readIds } from "./params.js";

// Answers a service error: 400 for a known one (e.g. a test case not in the
// requirement), else logs it and answers 500 with `failure`
function sendError(res, error, failure) {
  if (sendKnownError(res, error)) {
    return;
  }

  console.error(`${failure}:`, error);
  res.status(500).json({ message: failure });
}

export async function getDefects(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const defects = await getDefectsService(req.user, ids.projectId, ids.number);

    if (!defects) {
      return res.status(404).json({ message: "Requirement not found" });
    }

    res.json(defects);
  } catch (error) {
    sendError(res, error, "Failed to get defects");
  }
}

export async function createDefect(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const validation = validateCreateDefectDto(req.body);

    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const defect = await createDefectService(req.user, ids.projectId, ids.number, req.body);

    if (!defect) {
      return res.status(404).json({ message: "Requirement not found" });
    }

    res.status(201).json(defect);
  } catch (error) {
    sendError(res, error, "Failed to create defect");
  }
}

export async function updateDefect(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number", "defectNumber"]);

    if (!ids) {
      return;
    }

    const validation = validateUpdateDefectDto(req.body);

    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const defect = await updateDefectService(req.user, ids.projectId, ids.number, ids.defectNumber, req.body);

    if (!defect) {
      return res.status(404).json({ message: "Defect not found" });
    }

    res.json(defect);
  } catch (error) {
    sendError(res, error, "Failed to update defect");
  }
}

export async function deleteDefect(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number", "defectNumber"]);

    if (!ids) {
      return;
    }

    const deleted = await deleteDefectService(req.user, ids.projectId, ids.number, ids.defectNumber);

    if (!deleted) {
      return res.status(404).json({ message: "Defect not found" });
    }

    res.status(204).end();
  } catch (error) {
    sendError(res, error, "Failed to delete defect");
  }
}
