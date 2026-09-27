import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJsdoc from "swagger-jsdoc";
import { keycloakIssuer } from "../config/keycloak.js";

const routesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../routes");

// Base OpenAPI definition. Each endpoint is documented with an
// `@openapi` comment directly above its route in backend/routes/*.js.
const definition = {
  openapi: "3.0.3",
  info: {
    title: "AI Test Case Generator API",
    version: "0.1.0",
    description:
      "Backend API for the AI Test Case Generator senior project.\n\n" +
      "All endpoints need a Keycloak access token. Click **Authorize** and either " +
      "log in with Keycloak (OAuth2) or paste an access token (bearerAuth).",
  },
  servers: [{ url: `http://localhost:${process.env.PORT || 5001}` }],
  tags: [
    { name: "Users", description: "The logged-in user" },
    { name: "Projects", description: "Test case projects owned by the user" },
  ],
  components: {
    securitySchemes: {
      keycloak: {
        type: "oauth2",
        description: "Log in through Keycloak (Authorization Code + PKCE).",
        flows: {
          authorizationCode: {
            authorizationUrl: `${keycloakIssuer}/protocol/openid-connect/auth`,
            tokenUrl: `${keycloakIssuer}/protocol/openid-connect/token`,
            scopes: { openid: "OpenID Connect" },
          },
        },
      },
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste a Keycloak access token.",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { message: { type: "string", example: "Project not found" } },
        required: ["message"],
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          keycloakId: { type: "string", example: "5d1c0a2e-…" },
          email: { type: "string", nullable: true, example: "tester@example.com" },
          name: { type: "string", nullable: true, example: "Jane Tester" },
        },
        required: ["id", "keycloakId"],
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Commerce application" },
          description: {
            type: "string",
            nullable: true,
            example: "Checkout, payments and customer account flows",
          },
          userId: { type: "integer", example: 1 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "name", "userId", "createdAt", "updatedAt"],
      },
      CreateProjectRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1, example: "Commerce application" },
          description: {
            type: "string",
            nullable: true,
            example: "Checkout, payments and customer account flows",
          },
        },
        required: ["name"],
      },
    },
    responses: {
      Unauthorized: {
        description: "Missing, invalid or expired access token",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      ServerError: {
        description: "Unexpected server error",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  // Every endpoint needs one of the two login methods
  security: [{ keycloak: ["openid"] }, { bearerAuth: [] }],
};

export const openapiSpec = swaggerJsdoc({
  definition,
  apis: [path.join(routesDir, "*.js")],
});
