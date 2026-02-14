import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const text = completion.choices[0].message.content;

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
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
