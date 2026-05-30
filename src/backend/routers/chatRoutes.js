import express from "express";
import OpenAI from "openai";
import { requireAuth, requireProfileRole } from "../middlewares/requireAuth.js";
import { protectedApiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// OpenRouter is OpenAI-compatible, so the OpenAI SDK works by pointing at the
// OpenRouter base URL. The API key is read from the server environment and is
// never sent to the client.
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
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

router.post(
  "/chat",
  requireAuth,
  requireProfileRole("mentor", "learner"),
  protectedApiRateLimiter,
  async (req, res) => {
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
      res.status(500).json({ error: "Failed to get a response from the AI service." });
    }


    // Cap the number of messages in the conversation history. Without this
    // limit a caller can send an unbounded history and consume a large number
    // of input tokens per request.
    const MAX_MESSAGES = 50;
    if (messages.length > MAX_MESSAGES) {
      return res.status(400).json({
        error: `messages array must not exceed ${MAX_MESSAGES} entries.`,
      });
    }

    // Validate each message has the expected shape and enforce an individual
    // content length limit. Without a length cap a single message with very
    // long text can exhaust the upstream token quota.
    const MAX_CONTENT_LENGTH = 4000;
    const isValid = messages.every(
      (m) =>
        typeof m === "object" &&
        (m.role === "user" || m.role === "assistant" || m.role === "system") &&
        typeof m.content === "string" &&
        m.content.length <= MAX_CONTENT_LENGTH
    );

    if (!isValid) {
      return res
        .status(400)
        .json({
          error: `Each message must have a role (user|assistant|system) and a string content field of at most ${MAX_CONTENT_LENGTH} characters.`,
        });
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

    // Validate temperature before forwarding. OpenRouter accepts values in
    // [0, 2]. Values outside this range are rejected by the upstream API with
    // a 422 error that surfaces as an opaque 500 to the client. Clamp the
    // value server-side so the response is always a predictable 400.
    const tempNum = typeof temperature === "number" ? temperature : parseFloat(temperature);
    if (Number.isNaN(tempNum) || tempNum < 0 || tempNum > 2) {
      return res
        .status(400)
        .json({ error: "temperature must be a number between 0 and 2 inclusive." });
    }

    const response = await openrouter.chat.completions.create({
      model,
      messages: chatMessages,
      max_tokens: safeMaxTokens,
      temperature: tempNum,
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("Chat route error:", error);
    res.status(500).json({ error: "Failed to get a response from the AI service." });

  }
);

export default router;
