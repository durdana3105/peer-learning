import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { fileTypeFromFile } from "file-type";
import { requireAuth, requireOwnershipOrAdmin } from "../middlewares/requireAuth.js";
import { getSupabaseAdmin } from "../utils/supabase.js";

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

// Strict UUID validation for URL parameters
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Fields that are safe to expose publicly (non-sensitive profile data)
const PUBLIC_PROFILE_FIELDS = "id, name, bio, skills, avatar_url, teach_subjects, learn_subjects, interests, is_mentor, is_learner, sessions_completed, rating, points, streak, badges, learning_style, preferred_language, timezone";

// Fields available only to the profile owner (includes email, private info)
const PRIVATE_PROFILE_FIELDS = PUBLIC_PROFILE_FIELDS + ", email, last_active, last_seen, availability, learning_goals, focus_time_this_week";

// SECURITY (IDOR #1853): Server-side profile endpoint with authorization.
// Replaces direct Supabase client calls that could be manipulated.
// Returns public fields for other users, private fields for own profile.
router.get("/:userId/profile", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Strict UUID format validation to prevent injection
    if (!userId || !UUID_REGEX.test(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const isOwnProfile = req.user.id === userId;
    const isAdmin = req.user?.role === "admin"
      || req.user?.app_metadata?.role === "admin"
      || req.roles?.includes("admin");

    // Select fields based on who is requesting
    const fields = (isOwnProfile || isAdmin) ? PRIVATE_PROFILE_FIELDS : PUBLIC_PROFILE_FIELDS;

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select(fields)
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("[IDOR] Profile fetch error:", error.message);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.json({ success: true, profile });
  } catch (err) {
    console.error("[IDOR] Profile endpoint error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// SECURITY (IDOR #1853): Server-side profile update with ownership enforcement.
// Prevents users from modifying other users' profiles.
router.put("/:userId/profile", requireAuth, requireOwnershipOrAdmin({ paramName: "userId" }), async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !UUID_REGEX.test(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Only allow safe, non-gamification fields to be updated via this endpoint
    const allowedFields = ["name", "bio", "skills", "avatar_url", "teach_subjects", "learn_subjects", "interests", "learning_style", "preferred_language", "timezone", "availability", "learning_goals"];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Validate string lengths to prevent abuse
    if (updates.name && typeof updates.name === "string" && updates.name.length > 100) {
      return res.status(400).json({ error: "Name must be 100 characters or fewer" });
    }
    if (updates.bio && typeof updates.bio === "string" && updates.bio.length > 500) {
      return res.status(400).json({ error: "Bio must be 500 characters or fewer" });
    }

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("id, name, bio, skills, avatar_url")
      .maybeSingle();

    if (error) {
      console.error("[IDOR] Profile update error:", error.message);
      return res.status(500).json({ error: "Failed to update profile" });
    }

    return res.json({ success: true, profile });
  } catch (err) {
    console.error("[IDOR] Profile update endpoint error:", err);
    return res.status(500).json({ error: "Internal server error" });
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
