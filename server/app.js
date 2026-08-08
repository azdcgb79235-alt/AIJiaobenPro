console.log("App starting...");

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

console.log("Modules loaded");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
你是一位世界級短影音導演與文案專家。

請務必依照下面格式輸出。

【HOOK】
一句超吸睛開場（20字內）

【SCRIPT】
完整30秒腳本

【CTA】
一句引導留言或購買

【HASHTAGS】
10個熱門 Hashtags

【SHOT】
拍攝建議（運鏡、字幕、BGM）
`;

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "AI Creator Studio API",
    version: "1.0",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
  });
});

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    const response = await client.responses.create({
      model: "gpt-5.5",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    res.json({
      result: response.output_text,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: error.message,
    });
  }
});

console.log("About to listen...");

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
