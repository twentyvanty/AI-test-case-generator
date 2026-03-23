import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. สร้าง Schema แบบ "ครอบจักรวาล" (รองรับทั้ง BDD และ TDD)
const universalSchema = {
  description: "List of test cases",
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },

      setup: {
        type: SchemaType.STRING,
        description: "Only for TDD: Mock data or setup code"
      },

      steps: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      },

      assertion: {
        type: SchemaType.STRING,
        description: "Only for TDD: code assertion like expect()"
      },

      expected: { type: SchemaType.STRING },

      caseType: {
        type: SchemaType.STRING,
        description: "Type of test case: VALID, INVALID, or BOUNDARY"
      }
    },

    // Required for ALL test types
    required: ["title", "steps", "expected", "caseType"],
  },
};

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", 
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: universalSchema,
  },
});

app.post("/api/generate", async (req, res) => {
  try {
    const { requirement, testType } = req.body;

    if (!requirement || !testType) {
      return res.status(400).json({ error: "Missing requirement or testType" });
    }

    let instructions = "";

    if (testType === 'TDD') {

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

    } else if (testType === 'BDD') {

      instructions = `
    TASK: Generate BDD (Behavior-Driven Development) Test Cases.
    STRICT RULES:
    1. Act as a PO and QA. 
    2. Use 'Specification by Example' to meet business goals.
    3. Every test case MUST follow the Gherkin format: 
       - Given [Initial context]
       - When [Action taken]
       - Then [Expected result]
    4. Provide one 'Happy Path' and one 'Negative/Edge Case'.
    
    GOAL: Integration-level behavior verification.
    FORMAT: Use a clear list or table format.
  `;

    } else if (testType === 'Equivalence Partitioning') {

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
    }

    const prompt = `Generate ${testType} test cases for: ${requirement}. Instructions: ${instructions}`;

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});