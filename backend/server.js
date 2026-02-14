import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. กำหนดโครงสร้าง JSON ที่ต้องการ (Response Schema) 
// เพื่อให้ AI ตอบกลับมาเป็น JSON ที่ถูกต้อง 100%
const schema = {
  description: "List of test cases",
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, description: "Test title" },
      steps: { 
        type: SchemaType.ARRAY, 
        items: { type: SchemaType.STRING },
        description: "Steps to execute the test"
      },
      expected: { type: SchemaType.STRING, description: "Expected result" },
    },
    required: ["title", "steps", "expected"],
  },
};

// 3. Setup Model พร้อมตั้งค่า Response MIME Type เป็น JSON
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash", // ใช้รุ่นที่คุณ List มาได้
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: schema,
  },
});

app.post("/api/generate", async (req, res) => {
  try {
    const { requirement, testType } = req.body;

    if (!requirement || !testType) {
      return res.status(400).json({ error: "Missing input (requirement or testType)" });
    }

    const prompt = `Generate ${testType} test cases for the following requirement: ${requirement}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // เนื่องจากเราตั้งค่า responseMimeType แล้ว AI จะส่ง JSON เพียวๆ มาให้เลย
    const parsedData = JSON.parse(text);
    res.json(parsedData);

  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ 
      error: "Failed to generate content",
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Using model: gemini-2.0-flash`);
});