// server.js
// Basic backend for AiPermit.org
// - Accepts POST /summarize-text with JSON { text: "permit text here" }
// - Calls OpenAI to generate a plain-language summary
// - Returns { summary: "..." }

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

// Allow JSON bodies
app.use(express.json());
// Allow requests from your Squarespace site
app.use(
  cors({
    origin: "*", // you can later restrict this to your domain
  })
);

// Simple health check
app.get("/", (req, res) => {
  res.send("AiPermit backend is running.");
});

// Text summarization endpoint
app.post("/summarize-text", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "No text provided." });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "OPENAI_API_KEY not set on the server." });
    }

    const prompt = `
You are an assistant that simplifies complex permit documents.

The user has provided a permit. Your job:

1. Explain in plain English at about an 8th-grade reading level.
2. Clearly list:
   - What the permit allows
   - Key conditions or restrictions
   - Any deadlines, expirations, or renewal requirements
   - What the user must do to stay compliant
3. Keep it under about 300 words.
4. Use bullet points where helpful.

Here is the permit text:

"""${text.slice(0, 8000)}"""
    `.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      return res
        .status(500)
        .json({ error: "Error from OpenAI API.", details: errText });
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      return res
        .status(500)
        .json({ error: "No summary returned from OpenAI." });
    }

    res.json({ summary });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Placeholder for future PDF upload endpoint
app.post("/summarize-pdf", upload.single("file"), (req, res) => {
  return res.status(501).json({
    error:
      "PDF summarization not implemented yet. For now, paste text into the website.",
  });
});

// Render will provide PORT, but default to 4000 for local dev
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AiPermit backend listening on port ${PORT}`);
});
