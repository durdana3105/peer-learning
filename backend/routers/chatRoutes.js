import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validate.js";
import { chatSchemas } from "../validation/schemas.js";
dotenv.config();
const router = express.Router();

const MAX_TOKENS_CAP = 512;

const SYSTEM_PROMPT =
  "You are a helpful peer-learning assistant. Answer questions about coding, study techniques, and academic topics in a clear and supportive way.";

router.post("/chat", requireAuth, rateLimiter, validate(chatSchemas.chatCompletion), asyncHandler(async (req, res) => {
  // Validate API key at request time, not at module load time
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("[security] FATAL: OPENROUTER_API_KEY is not configured. Chat functionality will not work.");
    console.error("[security] Please set the OPENROUTER_API_KEY environment variable and restart the server.");
    return res.status(500).json({ error: "Chat service is not configured" });
  }

  const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.SITE_URL || "http://localhost:8080",
      "X-Title": "Peer Learning AI",
    },
  });

  const { model = "openai/gpt-3.5-turbo", max_tokens, temperature = 0.7 } = req.body;

  const safeMaxTokens = Math.min(
    typeof max_tokens === "number" ? max_tokens : MAX_TOKENS_CAP,
    MAX_TOKENS_CAP
  );

  const chatMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...req.body.messages];

  const response = await openrouter.chat.completions.create({
    model,
    messages: chatMessages,
    max_tokens: safeMaxTokens,
    temperature,
  });

  res.json({ reply: response.choices[0].message.content });
}));

export default router;