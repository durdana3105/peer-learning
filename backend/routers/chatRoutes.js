import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
dotenv.config();
const router = express.Router();

// OpenRouter is OpenAI-compatible, so the OpenAI SDK works by pointing at the
// OpenRouter base URL. The API key is read from the server environment and is
// never sent to the client.
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,   // must not be undefined
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:8080",
    "X-Title": "Peer Learning AI",
  },
});

// Allowed models. Requests specifying any other model are rejected to
// prevent cost escalation via expensive third-party models.
const ALLOWED_MODELS = new Set([
  "openai/gpt-3.5-turbo",
  "openai/gpt-4o-mini",
]);

// Server-side cap on tokens per request, regardless of what the caller sends.
const MAX_TOKENS_CAP = 512;

// Fixed system prompt prepended to every conversation server-side.
// Callers cannot override this via the request body, which prevents
// prompt injection attacks that would let them alter the assistant persona
// or bypass content guidelines.
const SYSTEM_PROMPT =
  "You are a helpful peer-learning assistant. Answer questions about coding, study techniques, and academic topics in a clear and supportive way.";

router.post("/chat", requireAuth, rateLimiter, async (req, res) => {
  try {
    const {
      messages,
      model = "openai/gpt-3.5-turbo",
      max_tokens,
      temperature = 0.7,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "A non-empty messages array is required." });
    }

    if (messages.length > 50) {
      return res.status(400).json({ error: "Maximum of 50 messages allowed per request." });
    }

    // Validate each message has the expected shape to avoid sending malformed
    // requests upstream.
    let totalLength = 0;
    const isValid = messages.every(
      (m) => {
        if (
          typeof m !== "object" ||
          (m.role !== "user" && m.role !== "assistant" && m.role !== "system") ||
          typeof m.content !== "string"
        ) {
          return false;
        }
        totalLength += m.content.length;
        return true;
      }
    );

    if (!isValid) {
      return res
        .status(400)
        .json({ error: "Each message must have a role (user|assistant|system) and a string content field." });
    }

    if (totalLength > 20000) {
      return res.status(400).json({ error: "Total message content exceeds maximum allowed length." });
    }

    // Reject unknown models to prevent cost escalation.
    if (!ALLOWED_MODELS.has(model)) {
      return res.status(400).json({ error: "Requested model is not allowed." });
    }

    // Cap token count server-side regardless of caller input.
    const safeMaxTokens = Math.min(
      typeof max_tokens === "number" ? max_tokens : MAX_TOKENS_CAP,
      MAX_TOKENS_CAP
    );

    const chatMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    const response = await openrouter.chat.completions.create({
      model,
      messages: chatMessages,
      max_tokens: safeMaxTokens,
      temperature,
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("Chat route error:", error);
    res.status(500).json({ error: error.message || "AI request failed" });
  }
});

export default router;
