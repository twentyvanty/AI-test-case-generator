// Must be the first import so .env is loaded before other modules read process.env
import "dotenv/config";

import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.routes.js";
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

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});