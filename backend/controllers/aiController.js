import { z } from "zod";

import { HttpError } from "../utils/httpError.js";
import { ALLOWED_AI_MODELS } from "../utils/constants.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openai/gpt-4o-mini";
const ALLOWED_MODELS = ALLOWED_AI_MODELS;

const ASK_AI_MAX_TOKENS = 512;
const SUMMARY_MAX_TOKENS = 400;
const RESPONSE_TOKEN_FLOOR = 64;
const ESTIMATED_CONTEXT_TOKENS = 8000;
const RESERVED_SYSTEM_AND_BUFFER_TOKENS = 400;

// Per-message content length caps
const MAX_MESSAGE_CONTENT_LENGTH = 2000;
const MAX_SUMMARY_MESSAGE_LENGTH = 1000;
const MAX_SUMMARY_MESSAGES = 50;
const MAX_ASK_MESSAGES = 10;
const MAX_TOTAL_CONTENT_LENGTH = 20000;
const AI_UPSTREAM_TIMEOUT_MS = 15_000;

const escapeForPrompt = (str) =>
  str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "")
    .replace(/\$/g, "\\$")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .replace(/\r/g, "");

const summaryResponseSchema = z.object({
  summary: z.string().trim().min(1),
  key_takeaways: z.array(z.string().trim().min(1)).max(12),
});

const mockInterviewReportSchema = z.object({
  strengths: z.array(z.string().trim().min(1)).max(10),
  areas_for_improvement: z.array(z.string().trim().min(1)).max(10),
  overall_score: z.number().min(0).max(100),
  summary: z.string().trim().min(1),
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

const parseStrictMockInterviewReport = (content) => {
  const direct = mockInterviewReportSchema.safeParse(JSON.parse(content));
  if (direct.success) {
    return direct.data;
  }

  throw new Error("Model did not return a valid mock interview report JSON payload.");
};

const callOpenRouter = async ({ messages, maxTokens, temperature = 0.7, responseFormat, model }) => {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new HttpError(503, "AI service is not configured.");
  }

  const body = {
    model: model || OPENROUTER_MODEL,
    messages,
    max_tokens: maxTokens,
    temperature,
  };

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_UPSTREAM_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new HttpError(503, "AI request timed out. Please try again.", {
        retryable: true,
        reason: "timeout",
      });
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
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
    const { messages, model: requestedModel, systemPrompt } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid messages provided" });
    }

    if (messages.length > MAX_ASK_MESSAGES) {
      return res.status(400).json({ error: `Maximum of ${MAX_ASK_MESSAGES} messages allowed.` });
    }

    // Validate every message: role, type, and content length
    let totalContentLength = 0;
    for (const m of messages) {
      if (m.role !== "user" && m.role !== "assistant") {
        return res.status(400).json({ error: "Messages can only contain user or assistant roles." });
      }
      if (typeof m.content !== "string") {
        return res.status(400).json({ error: "Each message must have a string content field." });
      }
      if (m.content.length > MAX_MESSAGE_CONTENT_LENGTH) {
        return res.status(400).json({ error: `Each message must be under ${MAX_MESSAGE_CONTENT_LENGTH} characters.` });
      }
      totalContentLength += m.content.length;
    }

    if (totalContentLength > MAX_TOTAL_CONTENT_LENGTH) {
      return res.status(400).json({ error: "Total message content exceeds maximum allowed length." });
    }

    const latestMessage = messages[messages.length - 1].content;
    const maxTokens = budgetResponseTokens(latestMessage, ASK_AI_MAX_TOKENS);

    const model = ALLOWED_MODELS.includes(requestedModel) ? requestedModel : OPENROUTER_MODEL;
    
    const openRouterMessages = [
      {
        role: "system",
        content:
          systemPrompt || "You are an AI peer mentor for students. Answer questions about coding, AI, DSA, and roadmaps in a supportive, clear, and approachable way.",
      },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const data = await callOpenRouter({
      maxTokens,
      model,
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

    if (messages.length > MAX_SUMMARY_MESSAGES) {
      return res.status(400).json({
        error: `Maximum of ${MAX_SUMMARY_MESSAGES} messages allowed for summary generation.`,
      });
    }

    // Validate and sanitize each message: extract only expected fields,
    // cap per-message length, and accumulate total content length.
    let totalContentLength = 0;
    const sanitizedMessages = [];

    for (const msg of messages) {
      const username = typeof msg.username === "string" ? msg.username.slice(0, 100) : "User";
      const message = typeof msg.message === "string" ? msg.message.slice(0, MAX_SUMMARY_MESSAGE_LENGTH) : "";

      if (!message) continue;

      totalContentLength += username.length + message.length;
      if (totalContentLength > MAX_TOTAL_CONTENT_LENGTH) {
        break;
      }

      sanitizedMessages.push({ username, message });
    }

    if (sanitizedMessages.length === 0) {
      return res.status(400).json({
        error: "No valid messages found for summary generation.",
      });
    }

    let conversationText = sanitizedMessages
      .map((msg) => `${msg.username}: ${msg.message}`)
      .join("\n");

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

export const conductMockInterview = async (req, res, next) => {
  try {
    const { messages, role } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid messages provided" });
    }

    if (typeof role !== "string" || !role.trim()) {
      return res.status(400).json({ error: "Role is required" });
    }

    for (const m of messages) {
      if (
        !m ||
        typeof m !== "object" ||
        (m.role !== "user" && m.role !== "assistant")
      ) {
        return res.status(400).json({ error: "Messages can only contain user or assistant roles." });
      }
    }

    const latestMessage = messages[messages.length - 1].content;
    if (typeof latestMessage !== "string" || latestMessage.length > 2000) {
      return res.status(400).json({ error: "Message exceeds maximum length" });
    }

    const maxTokens = budgetResponseTokens(latestMessage, ASK_AI_MAX_TOKENS);
    
    const openRouterMessages = [
      {
        role: "system",
        content: `You are acting as a strict but fair ${escapeForPrompt(role)} conducting a mock interview for a candidate. 
        Follow these rules:
        1. Ask ONLY ONE question at a time.
        2. Wait for the candidate's response before proceeding.
        3. Provide very brief, constructive feedback on their previous answer (if applicable), then ask the next question.
        4. Do not break character. Do not provide a list of questions at once.`,
      },
      ...messages.slice(-20).map(m => ({ role: m.role, content: m.content || "" }))
    ];

    const data = await callOpenRouter({
      maxTokens,
      temperature: 0.6,
      messages: openRouterMessages,
    });

    const content = extractMessageContent(data);
    if (!content) {
      throw new HttpError(502, "AI service returned an empty response.");
    }

    res.json({ answer: content });
  } catch (error) {
    next(error);
  }
};

export const generateMockInterviewReport = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages are required" });
    }

    const conversationText = messages
      .map((msg) => `${msg.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${msg.content}`)
      .join("\n")
      .slice(-20000);

    const maxTokens = budgetResponseTokens(conversationText, SUMMARY_MAX_TOKENS);

    const data = await callOpenRouter({
      maxTokens,
      temperature: 0.3,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert technical recruiter evaluating a mock interview. Return only strict JSON with exactly these keys: strengths (array of strings), areas_for_improvement (array of strings), overall_score (number between 0 and 100), and summary (string).",
        },
        {
          role: "user",
          content: conversationText,
        },
      ],
    });

    const content = extractMessageContent(data);
    if (!content) {
      throw new HttpError(502, "Report generation returned an empty response.");
    }

    res.json(parseStrictMockInterviewReport(content));
  } catch (error) {
    if (error instanceof SyntaxError || error.message.includes("valid mock interview report JSON payload")) {
      next(new HttpError(502, "Report generation returned an invalid response format."));
    } else {
      next(error);
    }
  }
};
