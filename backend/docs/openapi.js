import path from "node:path";
import { fileURLToPath } from "node:url";
import swaggerJsdoc from "swagger-jsdoc";
import { keycloakIssuer } from "../config/keycloak.js";
import { TECHNIQUE_KEYS } from "../ai/techniques.js";

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
    { name: "Requirements", description: "Requirements inside a project (step 1)" },
    { name: "AI generation", description: "AI runs, saved as generation history" },
    { name: "Documents", description: "Reading text out of requirement documents" },
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
      Requirement: {
        type: "object",
        properties: {
          id: { type: "integer", example: 7 },
          projectId: { type: "integer", example: 1 },
          number: { type: "integer", example: 1, description: "Shown as REQ-0001" },
          title: { type: "string", example: "Password reset by email" },
          techniques: {
            type: "array",
            items: { $ref: "#/components/schemas/TechniqueKey" },
            description: "Empty = let the AI choose",
          },
          status: {
            type: "string",
            enum: ["DRAFT", "SCENARIOS_READY", "CASES_READY", "REPORTED"],
          },
          sourceFileName: { type: "string", nullable: true, example: "reset-spec.pdf" },
          scenarioCount: { type: "integer", example: 4 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "projectId", "number", "title", "techniques", "status", "scenarioCount"],
      },
      RequirementDetail: {
        allOf: [
          { $ref: "#/components/schemas/Requirement" },
          {
            type: "object",
            properties: {
              text: {
                type: "string",
                example:
                  "Users must reset their password via an email link. The link expires after 30 minutes.",
              },
              scenarios: { type: "array", items: { $ref: "#/components/schemas/Scenario" } },
              latestScenarioRun: {
                type: "object",
                nullable: true,
                description: "The most recent scenario draft (null if never drafted)",
                properties: {
                  id: { type: "integer" },
                  status: { $ref: "#/components/schemas/GenerationStatus" },
                  attempts: { type: "integer" },
                  validation: { type: "object", nullable: true },
                  errorMessage: { type: "string", nullable: true },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
            required: ["text", "scenarios"],
          },
        ],
      },
      CreateRequirementRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 255, example: "Password reset by email" },
          text: {
            type: "string",
            minLength: 1,
            maxLength: 50000,
            example:
              "Users must reset their password via an email link. The link expires after 30 minutes.",
          },
          techniques: {
            type: "array",
            items: { $ref: "#/components/schemas/TechniqueKey" },
            description: "Empty or left out = let the AI choose",
            example: ["boundaryValue", "stateTransition"],
          },
          sourceFileName: { type: "string", nullable: true, maxLength: 255 },
        },
        required: ["title", "text"],
      },
      UpdateRequirementRequest: {
        type: "object",
        description: "Send at least one field",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 255 },
          text: { type: "string", minLength: 1, maxLength: 50000 },
          techniques: { type: "array", items: { $ref: "#/components/schemas/TechniqueKey" } },
          sourceFileName: { type: "string", nullable: true, maxLength: 255 },
        },
      },
      TechniqueKey: {
        type: "string",
        enum: TECHNIQUE_KEYS,
      },
      Scenario: {
        type: "object",
        properties: {
          id: { type: "integer", example: 12 },
          requirementId: { type: "integer", example: 7 },
          runId: { type: "integer", nullable: true, description: "The run that produced it" },
          number: { type: "integer", example: 1, description: "Shown as SC-01" },
          title: { type: "string", example: "Reset link expiry at 30 minutes" },
          description: { type: "string" },
          technique: { type: "string", nullable: true, example: "boundaryValue" },
          selected: { type: "boolean" },
          estimatedCases: { type: "integer", example: 3 },
          source: { type: "string", enum: ["AI", "MANUAL"] },
          position: { type: "integer" },
        },
        required: ["id", "number", "title", "description", "selected", "source"],
      },
      GenerationStatus: {
        type: "string",
        enum: ["PASSED", "NEEDS_REVIEW", "FAILED"],
        description:
          "PASSED = all checks passed; NEEDS_REVIEW = still failing a check after 3 attempts " +
          "(output kept for manual review); FAILED = no usable output (e.g. AI busy)",
      },
      GenerationRun: {
        type: "object",
        properties: {
          id: { type: "integer" },
          requirementId: { type: "integer" },
          kind: { type: "string", enum: ["TECHNIQUE_SUGGESTION", "SCENARIOS", "TEST_CASES"] },
          status: { $ref: "#/components/schemas/GenerationStatus" },
          attempts: { type: "integer", minimum: 1, maximum: 3 },
          generatorModel: { type: "string", example: "gemini-3.5-flash" },
          validatorModel: { type: "string", example: "gemini-3.5-flash-lite" },
          input: { type: "object" },
          output: { type: "object", nullable: true },
          validation: {
            type: "object",
            nullable: true,
            description: "Check results: final (chosen attempt) and every attempt",
          },
          usage: { type: "object", nullable: true, description: "Token counts per role" },
          errorMessage: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
        required: ["id", "kind", "status", "attempts"],
      },
      ExtractedDocument: {
        type: "object",
        properties: {
          fileName: { type: "string", example: "reset-spec.pdf" },
          size: { type: "integer", description: "Bytes", example: 48213 },
          text: { type: "string" },
        },
        required: ["fileName", "size", "text"],
      },
    },
    responses: {
      BadRequest: {
        description: "Invalid id or request body",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Not found, or it belongs to another user",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
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
