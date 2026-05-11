import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();
const port = Number(process.env.PORT || 8080);

const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function originMatchesRule(origin, rule) {
  if (rule === origin) {
    return true;
  }

  if (!rule.includes("*")) {
    return false;
  }

  const regex = new RegExp(`^${escapeRegExp(rule).replace(/\\\*/g, ".*")}$`);
  return regex.test(origin);
}

app.use(
  cors({
    origin: (origin, callback) => {
      const isAllowed =
        !origin ||
        corsOrigins.length === 0 ||
        corsOrigins.some((rule) => originMatchesRule(origin, rule));

      if (isAllowed) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin is not allowed by CORS policy"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "lionheart-railway-api" });
});

function buildPrompt(system, userInput) {
  return {
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
    max_tokens: Number(process.env.MAX_TOKENS || 900),
    system,
    messages: [
      {
        role: "user",
        content: userInput,
      },
    ],
  };
}

async function callAnthropic(payload) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n")
    .trim();

  return {
    id: data.id,
    model: data.model,
    text,
    usage: data.usage,
  };
}

app.post("/api/ai/chat", async (req, res) => {
  try {
    const message = (req.body?.message || "").toString().trim();
    const context = (req.body?.context || "").toString().trim();

    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const payload = buildPrompt(
      "You are Lion Heart Fights AI. Give practical, concise combat sports support for fighters, coaches, and managers.",
      context ? `Context:\n${context}\n\nUser request:\n${message}` : message
    );

    const output = await callAnthropic(payload);
    res.json({ reply: output.text, model: output.model, usage: output.usage });
  } catch (error) {
    res.status(500).json({ error: error.message || "AI request failed" });
  }
});

app.post("/api/ai/analyze", async (req, res) => {
  try {
    const opponentNotes = (req.body?.opponentNotes || "").toString().trim();
    const fighterStyle = (req.body?.fighterStyle || "").toString().trim();

    if (!opponentNotes) {
      res.status(400).json({ error: "opponentNotes is required" });
      return;
    }

    const analysisPrompt = [
      "Analyze the following opponent notes and return:",
      "1) Top 3 risks",
      "2) Top 3 openings",
      "3) Round-by-round tactical plan",
      "4) 1-week training emphasis",
      "5) Pre-fight mental checklist",
      "Keep output practical and concise.",
      "",
      `Fighter style: ${fighterStyle || "Not provided"}`,
      `Opponent notes: ${opponentNotes}`,
    ].join("\n");

    const payload = buildPrompt(
      "You are an elite striking and grappling strategist for professional fight camps.",
      analysisPrompt
    );

    const output = await callAnthropic(payload);
    res.json({ analysis: output.text, model: output.model, usage: output.usage });
  } catch (error) {
    res.status(500).json({ error: error.message || "Analysis request failed" });
  }
});

app.listen(port, () => {
  console.log(`lionheart-railway-api listening on port ${port}`);
});
