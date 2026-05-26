import express from "express";
import { getRecommendedPartners } from "../controllers/matchController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = express.Router();

// 🚀 Smart Study Partner Recommendations
router.get(
  "/recommendations",
  requireAuth,
  getRecommendedPartners
);

export default router;