import express from "express";

import {
  askAI,
  generateSessionSummary,
} from "../controllers/aiController.js";

import { requireAuth, requireProfileRole } from "../middlewares/requireAuth.js";
import { protectedApiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

/**
 * AI chat endpoint (secured version from main)
 */
router.post(
  "/ask",
  requireAuth,
  requireProfileRole("mentor", "learner"),
  protectedApiRateLimiter,
  askAI
);

/**
 * Session summary generator (new feature)
 */
router.post(
  "/generate-summary",
  requireAuth,
  requireProfileRole("mentor", "learner"),
  protectedApiRateLimiter,
  generateSessionSummary
);

export default router;