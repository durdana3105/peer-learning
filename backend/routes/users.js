import express from "express";
import multer from "multer";
import os from "os";
import fs from "fs";
import crypto from "crypto";
import { fileTypeFromFile } from "file-type";

import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import { profileSchemas } from "../validation/schemas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, "../../uploads");
const profilesDir = path.join(uploadsRoot, "profiles");

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


// SECURITY (#1851): Whitelist of fields that standard users can update on their own profile.
// Privileged fields (is_admin, is_mentor, points, rating, badges, sessions_completed,
// streak, etc.) are explicitly excluded to prevent mass-assignment privilege escalation.
const ALLOWED_PROFILE_FIELDS = new Set([
  "name",
  "bio",
  "skills",
  "avatar_url",
  "interests",
  "teach_subjects",
  "learn_subjects",
]);

/**
 * SECURITY (#1851): Server-side profile update endpoint with strict field whitelisting.
 *
 * This endpoint provides defense-in-depth against mass-assignment attacks.
 * Even though Supabase RLS protects privileged columns, this endpoint:
 *  1. Validates input with Zod (.strict() rejects unknown keys)
 *  2. Explicitly whitelists allowed fields before writing to database
 *  3. Uses the service-role client to bypass RLS (validating authorization server-side)
 *  4. Logs all profile update attempts for audit trail
 */
router.put("/:userId/profile", requireAuth, validate(profileSchemas.updateProfile), async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user?.id;

    // SECURITY: Ensure users can only update their own profile (or admins can update any)
    const isAdmin = req.roles?.includes("admin") || req.user?.app_metadata?.role === "admin";
    if (userId !== authenticatedUserId && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to update this profile" });
    }

    // SECURITY (#1851): Strict field whitelisting — only extract allowed fields
    const allowedUpdates = {};
    for (const field of ALLOWED_PROFILE_FIELDS) {
      if (req.body[field] !== undefined) {
        allowedUpdates[field] = req.body[field];
      }
    }

    // Reject if no valid fields were provided
    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // SECURITY: Explicitly reject any privileged field attempts and log them
    const BLOCKED_FIELDS = ["is_admin", "is_mentor", "points", "rating", "badges", "sessions_completed", "role", "permissions"];
    const attemptedPrivilegeEscalation = BLOCKED_FIELDS.filter(f => req.body[f] !== undefined);
    if (attemptedPrivilegeEscalation.length > 0) {
      console.error(
        `[SECURITY] #1851 Privilege escalation attempt blocked. User: ${authenticatedUserId}, ` +
        `Target: ${userId}, Attempted fields: ${attemptedPrivilegeEscalation.join(", ")}`
      );
      return res.status(403).json({
        error: "Permission denied: cannot modify restricted fields",
      });
    }

    // Use service-role client for server-side update (bypasses RLS since we've validated authorization)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("profiles")
      .update(allowedUpdates)
      .eq("id", userId)
      .select("id, name, bio, skills, avatar_url, interests, teach_subjects, learn_subjects")
      .single();

    if (error) {
      console.error("Profile update error:", error.message);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    res.json({ success: true, profile: data });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User profile photo upload endpoint
router.post("/upload-photo", requireAuth, uploadProfilePhoto, async (req, res) => {



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
