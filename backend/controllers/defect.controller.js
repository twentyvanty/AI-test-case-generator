import {
  addDefectImages,
  createDefect as createDefectService,
  deleteDefect as deleteDefectService,
  deleteDefectImage as deleteDefectImageService,
  getDefectImage as getDefectImageService,
  getDefects as getDefectsService,
  updateDefect as updateDefectService,
} from "../services/defect.service.js";

import { validateCreateDefectDto, validateUpdateDefectDto } from "../dto/defect/defect.dto.js";
import { sendKnownError } from "./errors.js";
import { readIds } from "./params.js";
import { originalName } from "./upload-names.js";

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

// ---- Screenshots (D-037) --------------------------------------------------------

export async function uploadDefectImages(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number", "defectNumber"]);

    if (!ids) {
      return;
    }

    // The real (e.g. Thai) file names, shown only
    const files = (req.files ?? []).map((file) => ({ ...file, originalname: originalName(file) }));
    const defect = await addDefectImages(req.user, ids.projectId, ids.number, ids.defectNumber, files);

    if (!defect) {
      return res.status(404).json({ message: "Defect not found" });
    }

    res.status(201).json(defect);
  } catch (error) {
    sendError(res, error, "Failed to upload screenshots");
  }
}

// The image itself, only for its owner. Sent so the browser can only show it as
// the image type checked at upload (nosniff), inline, never cached by others.
export async function getDefectImage(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number", "defectNumber", "imageId"]);

    if (!ids) {
      return;
    }

    const image = await getDefectImageService(req.user, ids.projectId, ids.number, ids.defectNumber, ids.imageId);

    if (!image) {
      return res.status(404).json({ message: "Screenshot not found" });
    }

    res.set({
      "Content-Type": image.mimeType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(image.fileName)}`,
    });

    res.sendFile(image.path, (error) => {
      if (error && !res.headersSent) {
        // The row exists but the file is gone
        res.status(404).json({ message: "Screenshot not found" });
      }
    });
  } catch (error) {
    sendError(res, error, "Failed to get screenshot");
  }
}

export async function deleteDefectImage(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number", "defectNumber", "imageId"]);

    if (!ids) {
      return;
    }

    const defect = await deleteDefectImageService(req.user, ids.projectId, ids.number, ids.defectNumber, ids.imageId);

    if (!defect) {
      return res.status(404).json({ message: "Screenshot not found" });
    }

    res.json(defect);
  } catch (error) {
    sendError(res, error, "Failed to delete screenshot");
  }
}
