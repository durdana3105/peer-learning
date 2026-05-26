import express from "express";
import { askAI } from "../controllers/aiController.js";

const router = express.Router();
router.post("/ask", askAI);

export default router;
