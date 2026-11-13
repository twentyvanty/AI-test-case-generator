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
    { name: "Scenarios", description: "Editing scenarios (step 2) and their draft history" },
    { name: "Test cases", description: "Generating, running and editing test cases (step 3)" },
    { name: "History", description: "Finished AI generations across all projects" },
    { name: "AI generation", description: "AI runs, saved as generation history" },
    { name: "Recently deleted", description: "Deleted items, restorable for 7 days" },
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
              testCaseCount: { type: "integer", example: 12 },
              testDataPlan: {
                type: "object",
                nullable: true,
                description:
                  "The test data every test case shares (D-035), written before the test-case batches. " +
                  "Only grows while test cases exist; null when there are none.",
                properties: {
                  conventions: { type: "array", items: { type: "string" }, example: ["School codes: SCH- + 3 digits"] },
                  records: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", example: "SCH-001" },
                        type: { type: "string", example: "School" },
                        details: { type: "string", example: "Green Valley School, 120 students" },
                        state: { type: "string", enum: ["exists", "doesNotExist"] },
                      },
                    },
                  },
                },
              },
              testCases: { type: "array", items: { $ref: "#/components/schemas/TestCase" } },
              latestScenarioRun: {
                type: "object",
                allOf: [{ $ref: "#/components/schemas/RunSummary" }],
                nullable: true,
                description:
                  "The newest run behind the CURRENT scenarios (null if they're all manual), " +
                  "so its review note matches what's on screen",
              },
              latestCaseRun: {
                type: "object",
                allOf: [{ $ref: "#/components/schemas/RunSummary" }],
                nullable: true,
                description: "The newest run behind the current test cases",
              },
              caseRuns: {
                type: "array",
                items: { $ref: "#/components/schemas/RunSummary" },
                description:
                  "Every run behind the current test cases (one per batch), oldest first: their review notes and AI notes are shown together",
              },
            },
            required: ["text", "scenarios", "testCaseCount", "testCases"],
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
          estimatedCases: { type: "integer", example: 3 },
          source: { type: "string", enum: ["AI", "MANUAL"] },
          position: { type: "integer" },
          testCaseCount: {
            type: "integer",
            example: 5,
            description: "Its active test cases. > 0 = locked: can't be edited, only deleted (D-029)",
          },
        },
        required: ["id", "number", "title", "description", "source", "testCaseCount"],
      },
      RunSummary: {
        type: "object",
        properties: {
          id: { type: "integer" },
          kind: { type: "string", enum: ["SCENARIOS", "TEST_CASES"] },
          status: { $ref: "#/components/schemas/GenerationStatus" },
          attempts: { type: "integer" },
          validation: { type: "object", nullable: true },
          errorMessage: { type: "string", nullable: true },
          reviewedAt: {
            type: "string",
            format: "date-time",
            nullable: true,
            description: "Set by Mark as reviewed",
          },
          createdAt: { type: "string", format: "date-time" },
        },
        required: ["id", "kind", "status", "attempts"],
      },
      TestCaseStatus: {
        type: "string",
        enum: ["OPEN", "PASS", "FAIL"],
        description: "OPEN = not run yet",
      },
      TestCase: {
        type: "object",
        properties: {
          id: { type: "integer", example: 40 },
          requirementId: { type: "integer", example: 7 },
          scenarioId: { type: "integer", example: 12 },
          scenarioNumber: { type: "integer", example: 1, description: "Its scenario, shown as SC-01" },
          runId: { type: "integer", nullable: true, description: "The run that produced it" },
          number: { type: "integer", example: 1, description: "Shown as TC-0001" },
          title: { type: "string", example: "Link used at exactly 30 minutes is rejected" },
          description: { type: "string" },
          precondition: { type: "string" },
          steps: { type: "array", items: { type: "string" } },
          expectedResult: { type: "string" },
          technique: { type: "string", nullable: true, example: "boundaryValue" },
          source: { type: "string", enum: ["AI", "MANUAL"] },
          status: { $ref: "#/components/schemas/TestCaseStatus" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "scenarioNumber", "number", "title", "precondition", "steps", "expectedResult", "status"],
      },
      UpdateTestCaseRequest: {
        type: "object",
        description: "Send at least one field (e.g. just the status)",
        properties: {
          status: { $ref: "#/components/schemas/TestCaseStatus" },
          title: { type: "string", minLength: 1, maxLength: 255 },
          description: { type: "string", maxLength: 2000 },
          precondition: { type: "string", maxLength: 2000 },
          steps: { type: "array", minItems: 1, maxItems: 25, items: { type: "string", maxLength: 1000 } },
          expectedResult: { type: "string", minLength: 1, maxLength: 2000 },
        },
      },
      GenerationHistoryItem: {
        type: "object",
        description:
          "One click on Draft / Generate more / Generate test cases. Test cases are generated in batches (one run each); those runs are combined into one item.",
        properties: {
          id: { type: "integer", description: "The (first) run's id" },
          runIds: { type: "array", items: { type: "integer" }, description: "Every run in this item" },
          kind: { type: "string", enum: ["SCENARIOS", "TEST_CASES"] },
          status: {
            type: "string",
            enum: ["PASSED", "NEEDS_REVIEW"],
            description: "NEEDS_REVIEW if any run in it needs review",
          },
          mode: { type: "string", enum: ["replace", "more"], nullable: true, description: "Scenario runs only" },
          itemCount: { type: "integer", description: "Scenarios or test cases produced" },
          createdAt: { type: "string", format: "date-time", description: "When it finished" },
          projectId: { type: "integer" },
          projectName: { type: "string" },
          requirementNumber: { type: "integer" },
          requirementTitle: { type: "string" },
        },
        required: ["id", "runIds", "kind", "status", "itemCount", "createdAt", "projectId", "requirementNumber"],
      },
      TestCaseDraftResult: {
        type: "object",
        properties: {
          run: {
            allOf: [{ $ref: "#/components/schemas/GenerationRun" }],
            description: "The first FAILED batch's run if any, else the last batch's run",
          },
          runs: {
            type: "array",
            items: { $ref: "#/components/schemas/GenerationRun" },
            description: "One run per batch (at most 8 estimated test cases), in scenario order",
          },
          testCases: {
            type: "array",
            items: { $ref: "#/components/schemas/TestCase" },
            description: "All active test cases afterwards (unchanged if the run FAILED)",
          },
        },
        required: ["run", "runs", "testCases"],
      },
      CreateScenarioRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 255, example: "Transfer on a public holiday" },
          description: { type: "string", maxLength: 2000 },
          technique: {
            type: "string",
            enum: [...TECHNIQUE_KEYS, null],
            nullable: true,
            description: "A technique key, or null for none",
          },
          estimatedCases: { type: "integer", minimum: 0, maximum: 20, example: 2 },
        },
        required: ["title"],
      },
      UpdateScenarioRequest: {
        type: "object",
        description: "Send at least one field",
        properties: {
          title: { type: "string", minLength: 1, maxLength: 255 },
          description: { type: "string", maxLength: 2000 },
          technique: {
            type: "string",
            enum: [...TECHNIQUE_KEYS, null],
            nullable: true,
            description: "A technique key, or null for none",
          },
          estimatedCases: { type: "integer", minimum: 0, maximum: 20 },
        },
      },
      ScenarioRun: {
        type: "object",
        properties: {
          id: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
          mode: { type: "string", enum: ["replace", "more"], description: "Draft or Generate more" },
          status: { $ref: "#/components/schemas/GenerationStatus" },
          reviewedAt: { type: "string", format: "date-time", nullable: true },
          attempts: { type: "integer" },
          scenarioCount: { type: "integer", description: "Scenarios in the list right after this run" },
          generatorModel: { type: "string" },
          validatorModel: { type: "string" },
          errorMessage: { type: "string", nullable: true },
          restorable: { type: "boolean" },
        },
        required: ["id", "createdAt", "mode", "status", "scenarioCount", "restorable"],
      },
      TrashItem: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["requirement", "scenario", "testCase"] },
          id: { type: "integer" },
          title: { type: "string" },
          deletedAt: { type: "string", format: "date-time" },
          purgeAt: { type: "string", format: "date-time", description: "When it's removed for good" },
          daysLeft: { type: "integer", example: 5 },
          projectId: { type: "integer" },
          projectName: { type: "string" },
          requirementNumber: { type: "integer" },
          requirementTitle: { type: "string" },
          scenarioNumber: { type: "integer", nullable: true },
          testCaseNumber: { type: "integer", nullable: true },
          testCaseCount: {
            type: "integer",
            description: "Scenarios: test cases deleted together with it (restored with it)",
          },
        },
        required: ["type", "id", "title", "deletedAt", "purgeAt", "daysLeft"],
      },
      RestoredItem: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["requirement", "scenario", "testCase"] },
          projectId: { type: "integer" },
          requirementNumber: { type: "integer" },
          scenarioNumber: { type: "integer", nullable: true },
          testCaseNumber: { type: "integer", nullable: true },
        },
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
          kind: { type: "string", enum: ["TECHNIQUE_SUGGESTION", "SCENARIOS", "TEST_CASES", "TEST_DATA_PLAN"] },
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
          readBy: {
            type: "string",
            enum: ["code", "ai"],
            description: "code = document; ai = image read by the vision model (check the text)",
          },
          error: {
            type: "string",
            nullable: true,
            description: "Why an image couldn't be read (AI busy, limit reached…); text is then empty",
          },
        },
        required: ["fileName", "size", "text", "readBy", "error"],
      },
    },
    responses: {
      Conflict: {
        description: "Not allowed in the current state (e.g. the scenario has test cases)",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
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
