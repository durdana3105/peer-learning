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

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || "dummy-key",
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:8080",
    "X-Title": "Peer Learning AI",
  },
});

const MAX_TOKENS_CAP = 512;

const SYSTEM_PROMPT =
  "You are a helpful peer-learning assistant. Answer questions about coding, study techniques, and academic topics in a clear and supportive way.";

router.post("/chat", requireAuth, rateLimiter, validate(chatSchemas.chatCompletion), asyncHandler(async (req, res) => {
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

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.warn("AI returned empty response for user message");
    return res.status(502).json({
      error: "AI service returned an empty response. Please try rephrasing your question.",
    });
  }
  res.json({ reply: content });
}));

export default router;
