import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getMe } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", authenticateToken, getMe);

export default router;