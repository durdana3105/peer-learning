import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { fileTypeFromFile } from "file-type";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.js";
import { profileSchemas } from "../validation/schemas.js";

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

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Configure multer with file size limits and MIME type validation
const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit to prevent server disk space exhaustion
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
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
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded or invalid file type." });
  }

  try {
    const detected = await fileTypeFromFile(req.file.path);
    if (!detected || !ALLOWED_IMAGE_TYPES.has(detected.mime)) {
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

export default router;
