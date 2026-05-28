import express from "express";

import {
  askAI,
  generateSessionSummary,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/ask", askAI);

router.post(
  "/generate-summary",
  generateSessionSummary
);

export default router;