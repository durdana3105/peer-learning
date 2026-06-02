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

    const ALLOWED_MODELS = [
      "google/gemini-2.5-flash",
      "meta-llama/llama-3-8b-instruct",
      "mistralai/mistral-7b-instruct:free",
      "google/gemma-7b-it:free"
    ];

    const safeModel = ALLOWED_MODELS.includes(model) ? model : "google/gemini-2.5-flash";
    const safeMaxTokens = Math.min(parseInt(max_tokens, 10) || 512, 1024);
    const safeTemperature = Math.min(Math.max(parseFloat(temperature) || 0.7, 0), 2);

    const response = await openrouter.chat.completions.create({
      model: safeModel,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: safeMaxTokens,
      temperature: safeTemperature,
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    next(error instanceof HttpError ? error : new HttpError(500, "AI request failed"));
  }
};
