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
  model: "gemini-3-flash-preview", // แนะนำให้ใช้ 1.5-flash เพื่อความเสถียรครับ
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

    // 2. ปรับตัวแปรคำสั่งตามประเภทที่เลือก
    let instructions = "";
    if (testType === 'TDD') {

      instructions = `
    You are a professional software developer practicing Test-Driven Development.

    Generate unit test cases focusing on:
    - Code logic
    - Edge cases
    - Validation scenarios

    Each test case MUST include:
    - title
    - setup (mock data or initialization code)
    - steps (logical execution steps)
    - assertion (example: expect(...).toBe(...))
    - expected
    - caseType

    Rules:
    - caseType must be "VALID" for normal working logic.
    - If the test checks invalid input or error handling, caseType must be "INVALID".
    - Do not leave caseType empty.
    - Return only a valid JSON array.
    - Do not include explanations.
    `;

    } else if (testType === 'BDD') {

      instructions = `
    You are a professional QA engineer writing Behavior-Driven Development test cases.

    Generate test cases in Gherkin style:
    - Given
    - When
    - Then

    Each test case MUST include:
    - title
    - steps (written in Given/When/Then style)
    - expected
    - caseType

    Rules:
    - Leave setup and assertion as empty strings.
    - If the scenario represents normal behavior, caseType must be "VALID".
    - If the scenario represents error or rejection behavior, caseType must be "INVALID".
    - Do not leave caseType empty.
    - Return only a valid JSON array.
    - Do not include explanations.
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