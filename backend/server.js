import express from "express"; //server
import cors from "cors"; //browser allows req
import dotenv from "dotenv"; //.env file
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Choose model
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash", 
});

app.post("/api/generate", async (req, res) => {
  try {
    const { requirement, testType } = req.body;

    if (!requirement || !testType) {
      return res.status(400).json({ error: "Missing input" });
    }

    const prompt = `
Generate ${testType} test cases in JSON format.
Requirement: ${requirement}

Return ONLY valid JSON like this:
[
  {
    "title": "Test title",
    "steps": ["step 1", "step 2"],
    "expected": "expected result"
  }
]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({
        error: "AI did not return valid JSON",
        raw: text,
      });
    }

    res.json(parsed);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
