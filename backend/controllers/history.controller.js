import {
  DEFAULT_HISTORY_LIMIT,
  HISTORY_KINDS,
  MAX_HISTORY_LIMIT,
  listGenerations,
} from "../services/history.service.js";

export async function getGenerations(req, res) {
  try {
    const kind = req.query.kind ?? null;
    const limit = req.query.limit === undefined ? DEFAULT_HISTORY_LIMIT : Number(req.query.limit);

    if (kind !== null && !HISTORY_KINDS.includes(kind)) {
      return res.status(400).json({
        message: `kind must be one of: ${HISTORY_KINDS.join(", ")}`,
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_HISTORY_LIMIT) {
      return res.status(400).json({
        message: `limit must be a whole number from 1 to ${MAX_HISTORY_LIMIT}`,
      });
    }

    res.json(await listGenerations(req.user, { kind, limit }));
  } catch (error) {
    console.error("Get generations error:", error);

    res.status(500).json({
      message: "Failed to get generation history",
    });
  }
}
