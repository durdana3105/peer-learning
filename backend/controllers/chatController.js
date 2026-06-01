import dotenv from "dotenv";
import OpenAI from "openai";
import { HttpError } from "../utils/httpError.js";

dotenv.config();

let openRouterInstance = null;

const getOpenRouterClient = () => {
  if (openRouterInstance) return openRouterInstance;

  if (!process.env.OPENROUTER_API_KEY) {
    return null;
  }

  openRouterInstance = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": process.env.SITE_URL || "http://localhost:8080",
      "X-Title": "Peer Learning AI",
    },
  });

  return openRouterInstance;
};

const SYSTEM_PROMPT =
  "You are a helpful peer-learning assistant. Answer questions about coding, study techniques, and academic topics in a clear and supportive way.";

export const createChatCompletion = async (req, res, next) => {
  try {
    const { messages, model, max_tokens, temperature } = req.body;
    const openrouter = getOpenRouterClient();

    if (!openrouter) {
      next(new HttpError(500, "AI request failed", { cause: "OPENROUTER_API_KEY is missing" }));
      return;
    }

    const response = await openrouter.chat.completions.create({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: max_tokens ?? 512,
      temperature,
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(500, "AI request failed"));
  }
};
