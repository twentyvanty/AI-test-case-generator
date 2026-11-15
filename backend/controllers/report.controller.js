import { getReport as getReportService } from "../services/report.service.js";
import { readIds } from "./params.js";

export async function getReport(req, res) {
  try {
    const ids = readIds(req, res, ["projectId", "number"]);

    if (!ids) {
      return;
    }

    const report = await getReportService(req.user, ids.projectId, ids.number);

    if (!report) {
      return res.status(404).json({ message: "Requirement not found" });
    }

    res.json(report);
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ message: "Failed to build the report" });
  }
}
