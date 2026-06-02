import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
dotenv.config();
const router = express.Router();

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "dummy-key",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:8080",
    "X-Title": "Peer Learning AI",
  },
});

const ALLOWED_MODELS = new Set([
  "openai/gpt-3.5-turbo",
  "openai/gpt-4o-mini",
]);

const MAX_TOKENS_CAP = 512;

const SYSTEM_PROMPT =
  "You are a helpful peer-learning assistant. Answer questions about coding, study techniques, and academic topics in a clear and supportive way.";

router.post("/chat", requireAuth, rateLimiter, asyncHandler(async (req, res) => {
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

  if (!ALLOWED_MODELS.has(model)) {
    return res.status(400).json({ error: "Requested model is not allowed." });
  }

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
}));

export default router;
