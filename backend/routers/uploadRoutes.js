import express from "express";
import { uploadMiddleware, handleUpload, handleDeleteUpload } from "../controllers/uploadController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = express.Router();

// Only authenticated users can upload files
router.post("/", requireAuth, uploadMiddleware, handleUpload);
router.delete("/", requireAuth, express.json(), handleDeleteUpload);

export default router;
