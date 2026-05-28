import express from "express";
import { askAI } from "../controllers/aiController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = express.Router();

// Simple in-memory rate limiter: max 10 requests per authenticated user per minute.
// Entries whose window has expired are evicted on each check to keep memory bounded.
const aiRequestCounts = new Map();
const AI_WINDOW_MS = 60 * 1000;
const AI_MAX_REQUESTS = 10;

const evictStaleEntries = () => {
  const now = Date.now();
  for (const [key, entry] of aiRequestCounts.entries()) {
    if (now - entry.windowStart >= AI_WINDOW_MS) {
      aiRequestCounts.delete(key);
    }
  }
};

const aiRateLimiter = (req, res, next) => {
  const userId = req.user.id;
  const now = Date.now();

  evictStaleEntries();

  const entry = aiRequestCounts.get(userId);

  if (!entry || now - entry.windowStart >= AI_WINDOW_MS) {
    aiRequestCounts.set(userId, { count: 1, windowStart: now });
    return next();
  }

  if (entry.count >= AI_MAX_REQUESTS) {
    return res.status(429).json({
      error: "Too many requests. Please wait before sending more AI questions.",
    });
  }

  entry.count += 1;
  next();
};

router.post("/ask", requireAuth, aiRateLimiter, askAI);

export default router;
