// Must be the first import so .env is loaded before other modules read process.env
import "dotenv/config";

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
import requirementRoutes from "./routes/requirement.routes.js";
import documentRoutes from "./routes/document.routes.js";
import scenarioRoutes from "./routes/scenario.routes.js";
import trashRoutes from "./routes/trash.routes.js";
import testCaseRoutes from "./routes/test-case.routes.js";
import defectRoutes from "./routes/defect.routes.js";
import historyRoutes from "./routes/history.routes.js";
import { purgeExpired } from "./services/trash.service.js";
import { openapiSpec } from "./docs/openapi.js";
import { keycloakClientId } from "./config/keycloak.js";

const app = express();

app.use(cors());
app.use(express.json());

// API docs: UI at /api/docs, raw OpenAPI spec at /api/docs.json
app.get("/api/docs.json", (req, res) => res.json(openapiSpec));
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec, {
    customSiteTitle: "AI Test Case Generator API",
    swaggerOptions: {
      persistAuthorization: true,
      // "Authorize" → Keycloak login using the frontend's public client
      initOAuth: {
        clientId: keycloakClientId,
        scopes: ["openid"],
        usePkceWithAuthorizationCodeGrant: true,
      },
    },
  })
);

app.use("/api", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects/:projectId/requirements", requirementRoutes);
app.use("/api/projects/:projectId/requirements/:number", scenarioRoutes);
app.use("/api/projects/:projectId/requirements/:number", testCaseRoutes);
app.use("/api/projects/:projectId/requirements/:number", defectRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/trash", trashRoutes);
app.use("/api/history", historyRoutes);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// An AI generation with retries can take several minutes; Node's default
// (5 min) would cut it off, so allow up to 10 min per request.
server.requestTimeout = 10 * 60 * 1000;

// "Recently deleted": remove items deleted more than 7 days ago, now and every hour
async function purge() {
  try {
    const removed = await purgeExpired();

    if (Object.values(removed).some((count) => count > 0)) {
      console.log("🗑️  Removed for good (deleted over 7 days ago):", removed);
    }
  } catch (error) {
    console.error("Purge of deleted items failed:", error);
  }
}

purge();
setInterval(purge, 60 * 60 * 1000).unref();