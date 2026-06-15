import express from "express";
import { getRecommendedPartners, getSupabaseDiscover } from "../controllers/matchController.js";
import { requireAuth, requireProfileRole } from "../middlewares/requireAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";
import { matchSchemas } from "../validation/schemas.js";

const router = express.Router();

// 🚀 Smart Study Partner Recommendations
router.get(
  "/recommendations",
  requireAuth,
  requireProfileRole("mentor", "learner"),
  rateLimiter,
  validate(matchSchemas.getRecommendedPartners),
  getRecommendedPartners
);

// 🚀 Modern Supabase Peer Discovery
router.get(
  "/supabase-discover",
  requireAuth,
  rateLimiter,
  validate(matchSchemas.getSupabaseDiscover),
  getSupabaseDiscover
);

export default router;