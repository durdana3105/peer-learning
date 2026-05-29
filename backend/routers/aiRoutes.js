import express from "express";

import {
  askAI,
  generateSessionSummary,
} from "../controllers/aiController.js";

import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

/**
 * AI chat endpoint (secured version from main)
 */
router.post("/ask", requireAuth, rateLimiter, askAI);

/**
 * Session summary generator (new feature)
 */
router.post("/generate-summary", rateLimiter, generateSessionSummary);

export default router;