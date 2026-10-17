import {
  deleteForever as deleteForeverService,
  listDeleted,
  restoreDeleted,
  TRASH_TYPES,
} from "../services/trash.service.js";
import { readIds } from "./params.js";

// Reads :type and :id. Answers 400 and returns null if invalid.
function readItem(req, res) {
  if (!TRASH_TYPES.includes(req.params.type)) {
    res.status(400).json({
      message: `Type must be one of: ${TRASH_TYPES.join(", ")}`,
    });
    return null;
  }

  const ids = readIds(req, res, ["id"]);

  return ids && { type: req.params.type, id: ids.id };
}

export async function getTrash(req, res) {
  try {
    res.json(await listDeleted(req.user));
  } catch (error) {
    console.error("Get trash error:", error);

    res.status(500).json({
      message: "Failed to get recently deleted items",
    });
  }
}

export async function restoreItem(req, res) {
  try {
    const item = readItem(req, res);

    if (!item) {
      return;
    }

    const restored = await restoreDeleted(req.user, item.type, item.id);

    if (!restored) {
      return res.status(404).json({
        message: "Deleted item not found",
      });
    }

    res.json(restored);
  } catch (error) {
    console.error("Restore item error:", error);

    res.status(500).json({
      message: "Failed to restore the item",
    });
  }
}

export async function deleteItemForever(req, res) {
  try {
    const item = readItem(req, res);

    if (!item) {
      return;
    }

    const deleted = await deleteForeverService(req.user, item.type, item.id);

    if (!deleted) {
      return res.status(404).json({
        message: "Deleted item not found",
      });
    }

    res.status(204).end();
  } catch (error) {
    console.error("Delete forever error:", error);

    res.status(500).json({
      message: "Failed to delete the item",
    });
  }
}
