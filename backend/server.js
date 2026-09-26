// Must be the first import so .env is loaded before other modules read process.env
import "dotenv/config";

import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api/projects", projectRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});