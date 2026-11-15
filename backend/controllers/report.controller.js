import { validateConclusionDto, validateFinalizeDto } from "../dto/report/report.dto.js";
import {
  finalizeReport as finalizeReportService,
  getReport as getReportService,
  getReportVersion as getReportVersionService,
  saveConclusion as saveConclusionService,
} from "../services/report.service.js";
import { sendKnownError } from "./errors.js";
import { readIds } from "./params.js";

// Answers 404 for null, else the result
function send(res, result, notFound = "Requirement not found") {
  if (!result) {
    return res.status(404).json({ message: notFound });
  }

  res.json(result);
}

function fail(res, error, failure) {
  if (sendKnownError(res, error)) {
    return;
  }

  console.error(`${failure}:`, error);
  res.status(500).json({ message: failure });
}

export async function getReport(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (ids) {
      send(res, await getReportService(req.user, ids.projectId, ids.number));
    }
  } catch (error) {
    fail(res, error, "Failed to build the report");
  }
}

export async function saveConclusion(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const validation = validateConclusionDto(req.body);

    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    send(res, await saveConclusionService(req.user, ids.projectId, ids.number, validation.value.conclusion));
  } catch (error) {
    fail(res, error, "Failed to save the conclusion");
  }
}

export async function finalizeReport(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const validation = validateFinalizeDto(req.body);

    if (!validation.valid) {
      return res.status(400).json({ message: validation.message });
    }

    const report = await finalizeReportService(req.user, ids.projectId, ids.number, validation.value);

    if (!report) {
      return res.status(404).json({ message: "Requirement not found" });
    }

    res.status(201).json(report);
  } catch (error) {
    fail(res, error, "Failed to finalize the report");
  }
}

export async function getReportVersion(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number", "version"]);

    if (ids) {
      send(
        res,
        await getReportVersionService(req.user, ids.projectId, ids.number, ids.version),
        "Report version not found"
      );
    }
  } catch (error) {
    fail(res, error, "Failed to get the report version");
  }
}
