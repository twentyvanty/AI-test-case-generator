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
      setup: { type: SchemaType.STRING, description: "Only for TDD: Mock data or setup code" },
      steps: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING } 
      },
      assertion: { type: SchemaType.STRING, description: "Only for TDD: code assertion like expect()" },
      expected: { type: SchemaType.STRING },
    },
    // กำหนดฟิลด์ที่ "ต้องมีเสมอ" ส่วน setup/assertion ปล่อยให้เป็น optional ได้
    required: ["title", "steps", "expected"],
  },
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash", // แนะนำให้ใช้ 1.5-flash เพื่อความเสถียรครับ
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
      instructions = "Act as a Developer. Focus on Unit Testing, code logic, and include 'setup' and 'assertion' fields.";
    } else {
      instructions = "Act as a QA. Focus on user behavior and Gherkin style (Given/When/Then). Leave 'setup' and 'assertion' empty.";
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