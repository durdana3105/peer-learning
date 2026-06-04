import express from "express";

import {
  askAI,
  generateSessionSummary,
  conductMockInterview,
  generateMockInterviewReport,
} from "../controllers/aiController.js";

import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validate.js";
import { aiSchemas } from "../validation/schemas.js";

const router = express.Router();

router.post("/ask", requireAuth, rateLimiter, validate(aiSchemas.askAI), asyncHandler(askAI));
router.post("/generate-summary", requireAuth, rateLimiter, validate(aiSchemas.generateSessionSummary), asyncHandler(generateSessionSummary));
router.post("/mock-interview/chat", requireAuth, rateLimiter, asyncHandler(conductMockInterview));
router.post("/mock-interview/report", requireAuth, rateLimiter, asyncHandler(generateMockInterviewReport));

export default router;
