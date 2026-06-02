import { z } from "zod";

import { HttpError } from "../utils/httpError.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openai/gpt-4o-mini";

const ASK_AI_MAX_TOKENS = 512;
const SUMMARY_MAX_TOKENS = 400;
const RESPONSE_TOKEN_FLOOR = 64;
const ESTIMATED_CONTEXT_TOKENS = 8000;
const RESERVED_SYSTEM_AND_BUFFER_TOKENS = 400;

const summaryResponseSchema = z.object({
  summary: z.string().trim().min(1),
  key_takeaways: z.array(z.string().trim().min(1)).max(12),
});

const estimateTokens = (text) => {
  if (typeof text !== "string" || !text.trim()) {
    return 0;
  }

  // Heuristic approximation for GPT-family tokenization.
  return Math.ceil(text.length / 4);
};

const budgetResponseTokens = (inputText, ceiling) => {
  const estimatedInputTokens = estimateTokens(inputText);
  const available =
    ESTIMATED_CONTEXT_TOKENS -
    estimatedInputTokens -
    RESERVED_SYSTEM_AND_BUFFER_TOKENS;

  if (available < RESPONSE_TOKEN_FLOOR) {
    throw new HttpError(
      400,
      "Input is too long for the selected model context window."
    );
  }

  return Math.max(RESPONSE_TOKEN_FLOOR, Math.min(ceiling, available));
};

const extractMessageContent = (data) => {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("\n")
      .trim();
    return text;
  }

  return "";
};

const parseStrictSummaryContent = (content) => {
  const direct = summaryResponseSchema.safeParse(JSON.parse(content));
  if (direct.success) {
    return direct.data;
  }

  throw new Error("Model did not return a valid summary JSON payload.");
};

const callOpenRouter = async ({ messages, maxTokens, temperature = 0.7, responseFormat }) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new HttpError(503, "AI service is not configured.");
  }

  const body = {
    model: OPENROUTER_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
  };

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  let response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new HttpError(503, "AI request timed out. Please try again.", {
        retryable: true,
        reason: "timeout",
      });
    }
    throw error;
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => null);
    throw new HttpError(
      response.status,
      errData?.error?.message || "AI API request failed"
    );
  }

  return response.json();
};

export const askAI = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid messages provided" });
    }

    const latestMessage = messages[messages.length - 1].content;
    if (typeof latestMessage !== "string" || latestMessage.length > 2000) {
      return res.status(400).json({ error: "Message exceeds maximum length of 2000 characters" });
    }

    const maxTokens = budgetResponseTokens(latestMessage, ASK_AI_MAX_TOKENS);
    
    const openRouterMessages = [
      {
        role: "system",
        content:
          "You are an AI peer mentor for students. Answer questions about coding, AI, DSA, and roadmaps in a supportive, clear, and approachable way.",
      },
      ...messages.slice(-10).map(m => ({ role: m.role || "user", content: m.content || "" }))
    ];

    const data = await callOpenRouter({
      maxTokens,
      temperature: 0.7,
      messages: openRouterMessages,
    });

    const content = extractMessageContent(data);
    if (!content) {
      throw new HttpError(502, "AI service returned an empty response.");
    }

    res.json({
      answer: content,
    });
  } catch (error) {
    next(error);
  }
};

export const generateSessionSummary = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Messages are required and must be an array",
      });
    }

    const recentMessages = messages.slice(-100);

    let conversationText = recentMessages
      .map((msg) => `${msg.username || "User"}: ${msg.message}`)
      .join("\n");

    if (conversationText.length > 20000) {
      conversationText = conversationText.slice(-20000);
    }

    const maxTokens = budgetResponseTokens(conversationText, SUMMARY_MAX_TOKENS);

    const data = await callOpenRouter({
      maxTokens,
      temperature: 0.2,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an AI learning assistant. Return only strict JSON with exactly two keys: summary (string) and key_takeaways (array of strings). Do not include markdown fences or extra text.",
        },
        {
          role: "user",
          content: conversationText,
        },
      ],
    });

    const content = extractMessageContent(data);
    if (!content) {
      throw new HttpError(502, "Summary generation returned an empty response.");
    }

    res.json(parseStrictSummaryContent(content));
  } catch (error) {
    if (error instanceof SyntaxError || error.message === "Model did not return a valid summary JSON payload.") {
      next(new HttpError(502, "Summary generation returned an invalid response format."));
    } else {
      next(error);
    }
  }
};
