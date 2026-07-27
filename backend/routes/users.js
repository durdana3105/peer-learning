import express from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import crypto from "crypto";
import { fileTypeFromFile } from "file-type";
import { getSupabaseAdmin } from "../utils/supabase.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// SECURITY (#1850): Strict allow-list of MIME types for profile photos.
// Only image formats are permitted — no scripts, executables, or archives.
const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// SECURITY (#1850): Strict allow-list of file extensions mapped from MIME types.
// This prevents extension manipulation attacks (e.g., uploading a .php with image MIME).
const MIME_TO_EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// SECURITY (#1850): Maximum file size for profile photos (2MB, reduced from 5MB).
const MAX_PROFILE_PHOTO_SIZE = 2 * 1024 * 1024;

// SECURITY (#1850): Maximum number of profile photos per user per hour.
const MAX_UPLOADS_PER_HOUR = 10;

// Track upload counts per user for rate limiting
const uploadCounts = new Map();
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// SECURITY (#1850): Use temp directory to avoid buffering in memory.
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: MAX_PROFILE_PHOTO_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPEG, PNG, WebP, GIF) are allowed."));
    }
  },
});

const uploadProfilePhoto = (req, res, next) => {
  upload.single("profilePhoto")(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Profile photo exceeds 2MB limit." });
    }
    if (err) {
      // SECURITY (#1850): Treat any multer/fileFilter rejection as 415 Unsupported Media Type
      return res.status(415).json({ error: err.message || "Only image files (JPEG, PNG, WebP, GIF) are allowed." });
    }
    next();
  });
};

// SECURITY (#1850): Cleanup temp file safely
const safeUnlink = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    // Ignore error to not break response
  }
};



/**
 * SECURITY (#1850): Profile photo upload endpoint.
 *
 * Fixes Remote Code Execution vulnerability by:
 * 1. Uploading to Supabase Storage (sandboxed bucket) instead of local server
 * 2. Strict MIME type allow-listing (JPEG, PNG, WebP, GIF only)
 * 3. Magic byte validation using file-type library
 * 4. Rate limiting per user (10 uploads per hour)
 * 5. Server-generated storage paths (no client path injection)
 * 6. Stripping execution permissions via Supabase Storage policies
 */
router.post("/upload-photo", requireAuth, rateLimiter, uploadProfilePhoto, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded or invalid file type." });
  }

  const userId = req.user?.id;
  if (!userId) {
    safeUnlink(req.file.path);
    return res.status(401).json({ error: "Authentication required." });
  }

  // SECURITY (#1850): Rate limit check — max 10 uploads per hour per user
  const now = Date.now();
  const userUploads = uploadCounts.get(userId) || [];
  const recentUploads = userUploads.filter(t => now - t < RATE_WINDOW_MS);
  if (recentUploads.length >= MAX_UPLOADS_PER_HOUR) {
    safeUnlink(req.file.path);
    return res.status(429).json({ error: "Too many uploads. Please try again later." });
  }
  recentUploads.push(now);
  uploadCounts.set(userId, recentUploads);

  try {
    // SECURITY (#1850): Magic byte validation — verify file content matches declared MIME type
    const detected = await fileTypeFromFile(req.file.path);
    if (!detected || !ALLOWED_IMAGE_MIMES.has(detected.mime)) {
      safeUnlink(req.file.path);
      return res.status(415).json({ error: "Only valid image files are allowed." });
    }

    // SECURITY (#1850): Use server-generated path — no client-supplied paths
    const extension = MIME_TO_EXTENSION[detected.mime] || "bin";
    const uniqueId = crypto.randomUUID();
    const storagePath = `${userId}/${Date.now()}_${uniqueId}.${extension}`;

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      safeUnlink(req.file.path);
      return res.status(500).json({ error: "Storage service is not configured." });
    }

    // SECURITY (#1850): Upload to Supabase Storage (sandboxed, not local server)
    const fileStream = fs.createReadStream(req.file.path);
    const { error: uploadError } = await supabaseAdmin.storage
      .from("profiles")
      .upload(storagePath, fileStream, {
        contentType: detected.mime,
        upsert: false,
        duplex: "half",
      });

    // Cleanup temp file after upload
    safeUnlink(req.file.path);

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      return res.status(500).json({ error: "Failed to upload profile photo." });
    }

    // Generate public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from("profiles")
      .getPublicUrl(storagePath);

    res.json({
      success: true,
      message: "Profile photo uploaded successfully.",
      fileUrl: publicUrlData.publicUrl,
    });
  } catch (err) {
    safeUnlink(req.file.path);
    console.error("Profile photo upload error:", err);
    return res.status(500).json({ error: "Error uploading profile photo." });
  }
});

export default router;
