import { getOrCreateUser } from "../services/user.service.js";

export async function getMe(req, res) {
  try {
    const user = await getOrCreateUser(req.user);

    res.json({
      message: "Authentication and database connection successful",
      user,
    });
  } catch (error) {
    console.error("User database error:", error);

    res.status(500).json({
      message: "Failed to create or find user",
    });
  }
}