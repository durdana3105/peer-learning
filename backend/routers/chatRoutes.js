import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validate.js";
import { chatSchemas } from "../validation/schemas.js";
import { HttpError } from "../utils/httpError.js";

dotenv.config();
const router = express.Router();

/**
 * SECURITY: Validate OPENROUTER_API_KEY at module initialization
 * This prevents the application from starting with invalid configuration.
 * Previously used a fallback to "dummy-key" which could enable silent
 * configuration failures and potential security issues.
 */
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || (process.env.NODE_ENV === "test" ? "dummy-key-for-tests" : undefined);

if (!OPENROUTER_API_KEY) {
  console.error("[security] FATAL: OPENROUTER_API_KEY is not configured. Chat functionality will not work.");
  console.error("[security] Please set the OPENROUTER_API_KEY environment variable and restart the server.");
  throw new Error("OPENROUTER_API_KEY is required for chat functionality");
}

/**
 * Initialize OpenAI client with validated API key
 * No fallback values - fails explicitly if configuration is invalid
 */
const openrouter = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL || "http://localhost:8080",
    "X-Title": "Peer Learning AI",
  },
});

const MAX_TOKENS_CAP = 512;

const SYSTEM_PROMPT =
  "You are a helpful peer-learning assistant. Answer questions about coding, study techniques, and academic topics in a clear and supportive way.";

/**
 * POST /api/chat
 *
 * Chat endpoint for AI-powered conversations.
 *
 * SECURITY:
 * - Requires authentication (requireAuth middleware)
 * - Rate limited to prevent API abuse
 * - Input validation using Zod schemas
 * - Token limits enforced to prevent cost escalation
 *
 * Error handling:
 * - 503 if AI service is unavailable
 * - 400 for invalid input
 * - 401 for authentication failures
 */
router.post("/chat", requireAuth, rateLimiter, validate(chatSchemas.chatCompletion), asyncHandler(async (req, res) => {
  const { model = "openai/gpt-3.5-turbo", max_tokens, temperature = 0.7 } = req.body;

  // Validate and cap token usage to prevent cost escalation
  const safeMaxTokens = Math.min(
    typeof max_tokens === "number" ? max_tokens : MAX_TOKENS_CAP,
    MAX_TOKENS_CAP
  );

  const chatMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...req.body.messages];

  try {
    const response = await openrouter.chat.completions.create({
      model,
      messages: chatMessages,
      max_tokens: safeMaxTokens,
      temperature,
    });

    // Validate response structure before accessing
    if (!response?.choices?.[0]?.message?.content) {
      throw new HttpError(502, "AI service returned an invalid response format");
    }

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    // Handle OpenAI API errors specifically
    if (error?.status === 401) {
      throw new HttpError(503, "AI service authentication failed. Please check API configuration.");
    }
    if (error?.status === 429) {
      throw new HttpError(429, "AI service rate limit exceeded. Please try again later.");
    }
    if (error?.status === 500 || error?.status === 502 || error?.status === 503) {
      throw new HttpError(503, "AI service is temporarily unavailable. Please try again later.");
    }
    // Re-throw other errors to be handled by the error handler middleware
    throw error;
  }
}));

export default router;
