import express from "express";
import { uploadMiddleware, handleUpload } from "../controllers/uploadController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = express.Router();

// Only authenticated users can upload files
router.post("/", requireAuth, uploadMiddleware, handleUpload);

export default router;
