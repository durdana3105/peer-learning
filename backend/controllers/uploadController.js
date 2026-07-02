import multer from "multer";
import os from "os";
import fs from "fs";
import { getSupabaseAdmin } from "../utils/supabase.js";
import { HttpError } from "../utils/httpError.js";

// Ensure files do not exceed 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Use os.tmpdir() to avoid buffering the whole file in memory.
// It uses the disk to stream the file, keeping memory usage low.
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // Only allow specific mimetypes, e.g. images
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    // Wait, the user mentioned avatars/resources. For resources, they might upload PDF etc.
    // The issue says: "Unrestricted image upload... check file.mimetype.startsWith('image/')"
    // But since uploadResource also uploads pdf, docx, etc., we should support both or define it dynamically.
    // Let's accept images and common document types since this endpoint is used for both.
    const allowedResourceTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "text/plain",
      "text/markdown",
      "text/javascript",
      "text/x-python",
      "application/x-python-code",
      "application/typescript"
    ];

    if (file.mimetype.startsWith("image/") || allowedResourceTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError(415, "Unsupported Media Type"));
    }
  },
});

export const uploadMiddleware = upload.single("file");

export const handleUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError(400, "No file uploaded.");
    }

    const file = req.file;
    const { folder = "resources", filePath } = req.body;

    if (!filePath) {
      // Clean up the temp file
      fs.unlinkSync(file.path);
      throw new HttpError(400, "filePath is required in the form data.");
    }

    // Verify folder is allowed
    const allowedBuckets = ["resources", "avatars", "profiles"];
    if (!allowedBuckets.includes(folder)) {
      fs.unlinkSync(file.path);
      throw new HttpError(400, "Invalid destination folder.");
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      fs.unlinkSync(file.path);
      throw new HttpError(500, "Supabase configuration is missing");
    }

    // Upload to Supabase Storage using a ReadStream
    const fileStream = fs.createReadStream(file.path);

    const { data, error } = await supabaseAdmin.storage
      .from(folder)
      .upload(filePath, fileStream, {
        contentType: file.mimetype,
        duplex: "half", // Required for node streams in newer fetch
      });

    // Cleanup local temp file
    fs.unlinkSync(file.path);

    if (error) {
      console.error("Supabase Storage Error:", error);
      throw new HttpError(500, "Failed to upload file to storage.");
    }

    // Generate public URL
    const { data: publicUrlData } = supabaseAdmin.storage.from(folder).getPublicUrl(filePath);

    res.status(200).json({
      success: true,
      data: {
        path: filePath,
        url: publicUrlData.publicUrl,
        size: file.size,
        mimetype: file.mimetype
      }
    });
  } catch (err) {
    // Make sure we clean up if something goes wrong
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
};
