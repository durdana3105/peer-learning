import express from "express";
import { getRecommendedPartners } from "../controllers/matchController.js";
import { requireAuth, requireProfileRole } from "../middlewares/requireAuth.js";
import { protectedApiRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// 🚀 Smart Study Partner Recommendations
router.get(
  "/recommendations",
  requireAuth,
  requireProfileRole("mentor", "learner"),
  protectedApiRateLimiter,
  getRecommendedPartners
);

export default router;