import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import { requireAuth } from "../middlewares/requireAuth.js";
dotenv.config();
const router = express.Router();

// OpenRouter is OpenAI-compatible, so the OpenAI SDK works by pointing at the
// OpenRouter base URL. The API key is read from the server environment and is
// never sent to the client.
console.log(process.env.OPENROUTER_API_KEY);
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,   // must not be undefined
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:8080",
    "X-Title": "Peer Learning AI",
  },
});

// const openrouter = new OpenAI({
//   apiKey: process.env.OPENROUTER_API_KEY,
//   baseURL: "https://openrouter.ai/api/v1",
//   defaultHeaders: {
//     "HTTP-Referer": process.env.SITE_URL || "http://localhost:8080",
//     "X-Title": "Peer Learning AI",
//   },
// });

// Allowed models. Requests specifying any other model are rejected to
// prevent cost escalation via expensive third-party models.
const ALLOWED_MODELS = new Set([
  "openai/gpt-3.5-turbo",
  "openai/gpt-4o-mini",
]);

// Server-side cap on tokens per request, regardless of what the caller sends.
const MAX_TOKENS_CAP = 512;

// Simple in-memory rate limiter: max 20 requests per authenticated user per minute.
const requestCounts = new Map();

const rateLimiter = (req, res, next) => {
  const userId = req.user.id;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 20;

  const entry = requestCounts.get(userId);

  if (!entry || now - entry.windowStart >= windowMs) {
    requestCounts.set(userId, { count: 1, windowStart: now });
    return next();
  }

  if (entry.count >= maxRequests) {
    return res.status(429).json({
      error: "Too many requests. Please wait before sending more messages.",
    });
  }

  entry.count += 1;
  next();
};
router.post("/chat", requireAuth, rateLimiter, async (req, res) => {
  try {
    const {
      messages,
      systemPrompt,
      model = "openai/gpt-3.5-turbo",
      max_tokens,
      temperature = 0.7,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "A non-empty messages array is required." });
    }

    // Validate each message has the expected shape to avoid sending malformed
    // requests upstream.
    const isValid = messages.every(
      (m) =>
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant" || m.role === "system") &&
        typeof m.content === "string"
    );

    if (!isValid) {
      return res
        .status(400)
        .json({ error: "Each message must have a role (user|assistant|system) and a string content field." });
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

    const chatMessages = systemPrompt
      ? [{ role: "system", content: String(systemPrompt) }, ...messages]
      : messages;

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

    // res.status(500).json({ error: "Failed to get a response from the AI service." });
  }
});

export default router;
