import express from "express";
import { getRecommendedPartners, getSupabaseDiscover } from "../controllers/matchController.js";
import { requireAuth, requireProfileRole } from "../middlewares/requireAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// 🚀 Smart Study Partner Recommendations
router.get(
  "/recommendations",
  requireAuth,
  requireProfileRole("mentor", "learner"),
  rateLimiter,
  getRecommendedPartners
);

// 🚀 Modern Supabase Peer Discovery
router.get(
  "/supabase-discover",
  requireAuth,
  rateLimiter,
  getSupabaseDiscover
);

export default router;