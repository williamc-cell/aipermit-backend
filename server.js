// server.js
// Basic backend for AiPermit.org
// - Accepts POST /summarize-text with JSON { text: "permit text here" }
// - Calls OpenAI to generate a plain-language summary
// - Returns { summary: "..." }

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

// middleware
app.use(
  cors({
    origin: "*", // restrict later
  })
);
app.use(express.json());

// Simple health check
app.get("/", (req, res) => {
  res.send("AiPermit backend is running.");
});

// Text summarization endpoint
app.post("/summarize-text", async (req, res) => {
  try {
    const { text } = req.body;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content:
            "Summarize this permit text in simple plain English: " + text,
        },
      ],
    });

    const summary = completion.choices[0].message.content;
    res.json({ result: summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to summarize text." });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port " + PORT));

