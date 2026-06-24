import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { fileTypeFromFile } from "file-type";
import { getUserReviews, getUserTrustMetrics } from "../controllers/reviewController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, "../../uploads");
const profilesDir = path.join(uploadsRoot, "profiles");

const router = express.Router();

// Storage configuration for profile photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
    cb(null, profilesDir);
  },
  filename: function (req, file, cb) {
    const userId = req.user?.id ?? 'unknown'
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `profile-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
});

// Configure multer with file size limits and MIME type validation
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit to prevent server disk space exhaustion
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      const error = new Error("Only image files are allowed!");
      error.code = "UNSUPPORTED_MEDIA_TYPE";
      cb(error, false);
    }
  }
});

const uploadProfilePhoto = (req, res, next) => {
  upload.single("profilePhoto")(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Profile photo exceeds 5MB limit." });
    }
    if (err) {
      if (err.code === "UNSUPPORTED_MEDIA_TYPE") {
         return res.status(415).json({ error: err.message });
      }
      return next(err);
    }
    next();
  });
};

const safeUnlink = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    // Ignore error to not break response
  }
};

// User profile photo upload endpoint
router.post("/upload-photo", requireAuth, uploadProfilePhoto, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded or invalid file type." });
  }

  try {
    const detected = await fileTypeFromFile(req.file.path);
    if (!detected || !detected.mime.startsWith("image/")) {
      safeUnlink(req.file.path);
      return res.status(415).json({ error: "Only valid image files are allowed." });
    }
  } catch (err) {
    safeUnlink(req.file.path);
    return res.status(500).json({ error: "Error validating file type." });
  }

  res.json({ 
    success: true, 
    message: "Profile photo uploaded successfully.",
    fileUrl: `/uploads/profiles/${req.file.filename}`
  });
});

// Fetch reviews for a specific user
router.get("/:id/reviews", requireAuth, rateLimiter, getUserReviews);

// Fetch trust metrics for a specific user
router.get("/:id/trust-score", requireAuth, rateLimiter, getUserTrustMetrics);

export default router;
