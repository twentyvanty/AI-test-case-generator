import express from "express";
import { authenticateToken } from "../middleware/auth.js";

import {
  getProjects,
  createProject,
  getProject,
} from "../controllers/project.controller.js";

const router = express.Router();

router.get("/", authenticateToken, getProjects);
router.post("/", authenticateToken, createProject);
router.get("/:id", authenticateToken, getProject);

export default router;