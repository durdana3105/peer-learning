import multer from "multer";
import os from "os";
import fs from "fs";
import crypto from "crypto";
import { getSupabaseAdmin } from "../utils/supabase.js";
import { HttpError } from "../utils/httpError.js";
import { fileTypeFromFile } from "file-type";

// Ensure files do not exceed 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Buckets this endpoint may write to, and the file types each one accepts.
// The client-supplied "folder" field only *selects* one of these presets —
// it never influences the actual storage path, which is always derived
// server-side from the authenticated user's id (fix for #1719).
const UPLOAD_PRESETS = {
  avatars: {
    mimetypes: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
    extensions: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    },
  },
  profiles: {
    mimetypes: new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]),
    extensions: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    },
  },
  resources: {
    mimetypes: new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "text/plain",
      "text/markdown",
      "text/javascript",
      "text/x-python",
      "application/x-python-code",
      "application/typescript",
    ]),
    extensions: {
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "application/zip": "zip",
      "text/plain": "txt",
      "text/markdown": "md",
      "text/javascript": "js",
      "text/x-python": "py",
      "application/x-python-code": "py",
      "application/typescript": "ts",
    },
  },
};

// Use os.tmpdir() to avoid buffering the whole file in memory.
// It uses the disk to stream the file, keeping memory usage low.
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req, file, cb) => {
    // IMPORTANT: the client must append the "folder" field to the FormData
    // *before* the "file" field, or multer will not have parsed it into
    // req.body yet when this filter runs.
    const folder = req.body?.folder;
    const preset = UPLOAD_PRESETS[folder];

    if (!preset) {
      cb(new HttpError(400, "Invalid or missing destination folder."));
      return;
    }

    if (!preset.mimetypes.has(file.mimetype)) {
      cb(new HttpError(415, "Unsupported Media Type for this upload type."));
      return;
    }

    cb(null, true);
  },
});

export const uploadMiddleware = upload.single("file");

export const handleUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError(400, "No file uploaded.");
    }

    const file = req.file;
    const folder = req.body.folder;
    const preset = UPLOAD_PRESETS[folder];

    // Defensive re-check: fileFilter already validated this, but don't rely
    // solely on it in case multer's field-ordering requirement isn't met.
    if (!preset || !preset.mimetypes.has(file.mimetype)) {
      fs.unlinkSync(file.path);
      throw new HttpError(400, "Invalid destination folder or file type.");
    }

    const userId = req.user?.id;
    if (!userId) {
      fs.unlinkSync(file.path);
      throw new HttpError(401, "Authentication required.");
    }

    // Server-side content verification (magic bytes and signature checking)
    const BINARY_MIMETYPES = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
    ]);

    const detected = await fileTypeFromFile(file.path);

    if (BINARY_MIMETYPES.has(file.mimetype)) {
      const isDocxAsZip = file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && detected?.mime === "application/zip";
      const isZipAsDocx = file.mimetype === "application/zip" && detected?.mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      if (!detected || (detected.mime !== file.mimetype && !isDocxAsZip && !isZipAsDocx)) {
        fs.unlinkSync(file.path);
        throw new HttpError(415, "Unsupported or suspicious upload: file content does not match the provided MIME type.");
      }
    } else {
      // Ensure text uploads are not disguised binaries or archives
      if (detected && !detected.mime.startsWith("text/") && !detected.mime.startsWith("application/xml")) {
        fs.unlinkSync(file.path);
        throw new HttpError(415, "Unsupported or suspicious upload: binary content detected in text upload.");
      }

      // Inspect first 4096 bytes for raw null bytes (0x00) indicating binary content in text uploads
      let containsNullByte = false;
      const fd = fs.openSync(file.path, "r");
      try {
        const buffer = Buffer.alloc(4096);
        const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
        for (let i = 0; i < bytesRead; i++) {
          if (buffer[i] === 0x00) {
            containsNullByte = true;
            break;
          }
        }
      } finally {
        fs.closeSync(fd);
      }

      if (containsNullByte) {
        fs.unlinkSync(file.path);
        throw new HttpError(415, "Unsupported or suspicious upload: null bytes found in text upload.");
      }
    }

    // The storage path is always generated on the server from the
    // authenticated user's own id. Client-supplied filePath/folder-path
    // values are never used to build it, so a user can never write into
    // another user's namespace.
    const extension = preset.extensions[file.mimetype] || "bin";
    const uniqueId = crypto.randomUUID();
    const filePath = `${userId}/${Date.now()}_${uniqueId}.${extension}`;

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      fs.unlinkSync(file.path);
      throw new HttpError(500, "Supabase configuration is missing");
    }

    // Upload to Supabase Storage using a ReadStream
    const fileStream = fs.createReadStream(file.path);
    
    // Prevent unhandled stream errors if the file is deleted or fails to read
    fileStream.on("error", (err) => {
      console.error("ReadStream error:", err);
    });

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
        mimetype: file.mimetype,
      },
    });
  } catch (err) {
    // Make sure we clean up if something goes wrong
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(err);
  }
};