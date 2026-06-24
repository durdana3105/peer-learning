import express from "express";
import { submitReview } from "../controllers/reviewController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";
import { reviewSchemas } from "../validation/schemas.js";

const router = express.Router();

// 🚀 Submit a new peer session review
router.post(
  "/",
  requireAuth,
  rateLimiter,
  validate(reviewSchemas.submitReview),
  submitReview
);

export default router;
