import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { authenticateToken } from "./middleware/auth.js";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Schema for test cases
const testCasesSchema = {
  description: "List of test cases",
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },
      steps: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      },
      expected: { type: SchemaType.STRING },
      caseType: {
        type: SchemaType.STRING,
        description: "Type of test case: VALID, INVALID, or BOUNDARY"
      }
    },
    required: ["title", "steps", "expected", "caseType"],
  },
};

// Schema for testing process
const testingProcessSchema = {
  description: "Testing process with implementation",
  type: SchemaType.OBJECT,
  properties: {
    testCases: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          red: { type: SchemaType.STRING, description: "TDD: Failing test" },
          green: { type: SchemaType.STRING, description: "TDD: Implementation" },
          refactor: { type: SchemaType.STRING, description: "TDD: Production code" },
          feature: { type: SchemaType.STRING, description: "BDD: Gherkin feature" },
          steps: { type: SchemaType.STRING, description: "BDD: Step definitions" },
          script: { type: SchemaType.STRING, description: "Complete script" }
        },
        required: ["title", "script"]
      }
    }
  },
  required: ["testCases"]
};

// Schema for decision table
const decisionTableSchema = {
  type: SchemaType.OBJECT,
  properties: {
    conditions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          values: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["name", "values"]
      }
    },
    actions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    rules: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          conditionValues: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          expectedActions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          caseType: { type: SchemaType.STRING }
        },
        required: ["title", "conditionValues", "expectedActions", "caseType"]
      }
    }
  },
  required: ["conditions", "actions", "rules"]
};

const testCasesModel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", 
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: testCasesSchema,
  },
});

const testingProcessModel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", 
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: testingProcessSchema,
  },
});

const decisionTableModel = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", 
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: decisionTableSchema,
  },
});

app.post("/api/generate-test-cases", async (req, res) => {
  try {
    const { requirement, technique } = req.body;

    if (!requirement || !technique) {
      return res.status(400).json({ error: "Missing requirement or technique" });
    }

    let instructions = "";

    if (technique === 'equivalence-partitioning') {
      instructions = `
    You are a professional QA engineer.

    Generate test cases using:
    - Equivalence Partitioning
    - Boundary Value Analysis

    Each test case MUST include:
    - title
    - steps
    - expected
    - caseType

    caseType must be exactly one of:
    - VALID
    - INVALID
    - BOUNDARY

    Do not explain anything.
    Return only valid JSON array.
    `;
    } else if (technique === 'boundary-value-analysis') {
      instructions = `
    You are a professional QA engineer.

    Generate test cases using Boundary Value Analysis.
    Focus on testing the boundaries of input ranges.

    Each test case MUST include:
    - title
    - steps
    - expected
    - caseType

    caseType must be exactly one of:
    - VALID
    - INVALID
    - BOUNDARY

    Do not explain anything.
    Return only valid JSON array.
    `;
    } else if (technique === 'decision-table') {
      instructions = `
    You are a QA engineer using Decision Table testing.

    Given the requirement, do the following:
    1. Identify all conditions (inputs) and their possible values
    2. Identify all possible actions (outputs/results)
    3. Generate ALL meaningful combinations of condition values as rules
    4. For each rule, specify which actions apply (Y/N)
    5. Each rule becomes one test case

    Requirement: ${requirement}

    Return a decision table with conditions, actions, and rules.
    Each rule maps a unique combination of condition values to expected actions.
    `;
    }

    const prompt = `Generate test cases for: ${requirement}. Instructions: ${instructions}`;

    let model;
    if (technique === 'decision-table') {
      model = decisionTableModel;
    } else {
      model = testCasesModel;
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 3. ส่งข้อมูลกลับ
    const parsedData = JSON.parse(text);
    res.json(parsedData);

  } catch (error) {
    console.error("❌ Gemini Error:", error);
    res.status(500).json({ error: "Server failed to process AI response", details: error.message });
  }
});

app.post("/api/generate-testing-process", async (req, res) => {
  try {
    const { testCases, approach } = req.body;

    if (!testCases || !approach) {
      return res.status(400).json({ error: "Missing testCases or approach" });
    }

    let instructions = "";

    if (approach === 'TDD') {
      instructions = `
    TASK: Generate a TDD (Test-Driven Development) workflow.
    STRICT RULES:
    1. You must output THREE separate code blocks.
    2. Phase 1: [RED] - Write only the failing test case. Explain why it fails (e.g., function not defined).
    3. Phase 2: [GREEN] - Write the simplest possible code to pass the RED test. 
    4. Phase 3: [REFACTOR] - Clean up the GREEN code for production standards.
    
    GOAL: Isolated unit testing with mocked dependencies and a rapid feedback loop.
    FORMAT: Use Markdown headers for each phase.
    `;
    } else if (approach === 'BDD') {
      instructions = `
    TASK: Generate BDD (Behavior-Driven Development) Test Cases.
    STRICT RULES:
    1. Act as a PO and QA.
    2. Use 'Specification by Example' to meet business goals.
    3. For each test case, return ONLY a "script" field.
    4. The script must follow this exact format:
        Scenario: [title]
          Given [initial context]
          When [action taken]
          Then [expected result]
    5. Provide one 'Happy Path' and one 'Negative/Edge Case'.
    6. Do NOT include Feature blocks, step definitions, or any code.
    7. Just the Scenario with Given/When/Then.
   
    GOAL: Integration-level behavior verification.
    FORMAT: Use a clear list or table format.
    `;
    }

    const prompt = `Test Cases: ${JSON.stringify(testCases)}. Approach: ${approach}. Instructions: ${instructions}`;

    const result = await testingProcessModel.generateContent(prompt);
    const text = result.response.text();

    const parsedData = JSON.parse(text);
    res.json(parsedData);

  } catch (error) {
    console.error("❌ Gemini Error:", error);
    res.status(500).json({ error: "Server failed to process AI response", details: error.message });
  }
});

app.get("/api/me", authenticateToken, async (req, res) => {
  try {
    const keycloakId = req.user.sub;

    const user = await prisma.user.upsert({
      where: {
        keycloakId,
      },
      update: {
        email: req.user.email ?? null,
        name: req.user.name ?? req.user.preferred_username ?? null,
      },
      create: {
        keycloakId,
        email: req.user.email ?? null,
        name: req.user.name ?? req.user.preferred_username ?? null,
      },
    });

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
});

app.get("/api/projects", authenticateToken, async (req, res) => {
  try {
    const keycloakId = req.user.sub;

    const user = await prisma.user.findUnique({
      where: {
        keycloakId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res.json(projects);
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      message: "Failed to get projects",
    });
  }
});

app.post("/api/projects", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const keycloakId = req.user.sub;

    const user = await prisma.user.findUnique({
      where: {
        keycloakId,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description ?? null,
        userId: user.id,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("Create project error:", error);

    res.status(500).json({
      message: "Failed to create project",
    });
  }
});

app.get("/test", (req, res) => {
  res.json({
    message: "Express is working",
  });
});

app.get("/test-db", async (req, res) => {
  try {
    const users = await prisma.user.findMany();

    res.json({
      message: "Database connection successful",
      users,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});