import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

dotenv.config();

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
    TASK: Generate TDD (Test-Driven Development) implementation for the given test cases.
    STRICT RULES:
    1. For each test case, provide:
       - RED: Failing test code (Jest format)
       - GREEN: Minimal code to pass the test
       - REFACTOR: Improved production code
    2. Include setup code and assertions
    3. Provide copy-paste ready code blocks
    
    FORMAT: Return JSON with testCases array, each containing:
    - red: string (failing test)
    - green: string (implementation)
    - refactor: string (production code)
    - script: string (complete test file)
    `;
    } else if (approach === 'BDD') {
      instructions = `
    TASK: Generate BDD (Behavior-Driven Development) implementation for the given test cases.
    STRICT RULES:
    1. Convert each test case to Gherkin format
    2. Provide Cucumber step definitions
    3. Include feature files and step implementation
    4. Provide copy-paste ready code blocks
    
    FORMAT: Return JSON with testCases array, each containing:
    - feature: string (Gherkin feature)
    - steps: string (step definitions)
    - script: string (complete feature file)
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});