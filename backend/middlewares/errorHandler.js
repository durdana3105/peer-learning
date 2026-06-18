import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.js";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Map of generic, user-safe messages for common HTTP status codes.
 * Used in production to avoid leaking internal details.
 */
const SAFE_STATUS_MESSAGES = {
  400: "Bad request.",
  401: "Authentication required.",
  403: "Access denied.",
  404: "Resource not found.",
  409: "Conflict.",
  422: "Unprocessable request.",
  429: "Too many requests.",
  500: "Internal server error.",
  502: "Service temporarily unavailable.",
  503: "Service unavailable.",
};

/**
 * Global Express error handler.
 *
 * Security strategy:
 *   - HttpError instances (intentionally thrown by our code) have safe, controlled messages.
 *     These are always returned to the client. Validation errors arrive wrapped in HttpError 
 *     objects from the validation middleware, and their details are always exposed.
 *   - All other unexpected errors (library crashes, DB errors, etc.) are fully masked
 *     in production with a generic status message. Verbose details are only shown in development.
 *   - Full error details are always logged server-side with the request ID for debugging.
 */
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const requestId = req.requestId || "unknown";

  // Gracefully handle Multer errors
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Payload Too Large: File size limit exceeded" });
    }
    return res.status(400).json({ error: err.message });
  }

  console.error("Unhandled error:", err);
  // --- Known HttpError (intentionally thrown by our code) ---
  if (err instanceof HttpError) {
    const status = err.statusCode || 500;
    console.error(`[${requestId}] HttpError ${status}:`, err.message);

    const payload = { error: err.message };

    if (err.details) {
      payload.details = err.details;
    }

    return res.status(status).json(payload);
  }

  // --- Unexpected / Unknown Errors ---
  // Always log the full error server-side for debugging
  console.error(`[${requestId}] Unhandled error:`, err);

  const status = err.status || err.statusCode || 500;

  if (isProduction) {
    // Return a generic message — never leak internal details
    const safeMessage = SAFE_STATUS_MESSAGES[status] || SAFE_STATUS_MESSAGES[500];
    return res.status(status).json({ error: safeMessage });
  }

  // Development: include full details for easier debugging
  const payload = { error: err.message || "Internal server error" };
  if (err.details) {
    payload.details = err.details;
  }
  if (err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};
