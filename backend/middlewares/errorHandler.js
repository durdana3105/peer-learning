import { ZodError } from "zod";

export const errorHandler = (err, req, res, next) => {
  // Gracefully handle Zod validation errors
  if (err instanceof ZodError || err.name === "ZodError") {
    // Downgrade to console.warn to prevent log pollution with massive stack traces
    console.warn("Validation Error:", err.errors || err.message);
    return res.status(400).json({ 
      error: "Validation failed", 
      details: err.errors 
    });
  }

  console.error("Unhandled error:", err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  const payload = { error: message };
  if (err.details) {
    payload.details = err.details;
  }
  res.status(status).json(payload);
};
