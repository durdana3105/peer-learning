import crypto from "crypto";
import { HttpError } from "../utils/httpError.js";

/**
 * Dedicated rate limiter for cron/webhook endpoints.
 * Much stricter than user-facing rate limits since these endpoints
 * trigger expensive bulk operations (DB queries, push notifications).
 */
const BACKGROUND_WINDOW_MS = 60_000;
const BACKGROUND_MAX_REQUESTS = 5;
const backgroundRateCounts = new Map();

export const isBackgroundRateLimited = (ip) => {
  const now = Date.now();
  const entry = backgroundRateCounts.get(ip);

  if (!entry || now - entry.windowStart >= BACKGROUND_WINDOW_MS) {
    backgroundRateCounts.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= BACKGROUND_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  return false;
};

/**
 * Cooldown tracker: prevents re-invocation of expensive cron jobs
 * within a minimum interval, regardless of authentication.
 */
const COOLDOWN_MS = 60_000;
const lastExecutions = new Map();

export const isOnCooldown = (routeKey) => {
  const now = Date.now();
  const lastRun = lastExecutions.get(routeKey);

  if (lastRun && now - lastRun < COOLDOWN_MS) {
    return true;
  }

  lastExecutions.set(routeKey, now);
  return false;
};

/**
 * Audit log function to track background endpoint invocations.
 */
export const auditLog = (req, res, authType) => {
  const ip = req.socket?.remoteAddress || req.ip || "unknown";
  res.on("finish", () => {
    console.log(
      `[AUDIT] ${new Date().toISOString()} | IP: ${ip} | Endpoint: ${req.originalUrl} | AuthType: ${authType} | Status: ${res.statusCode}`
    );
  });
};

/**
 * Express middleware that secures cron/webhook endpoints with three layers:
 *
 * 1. Rate limiting (5 req/min per IP) — prevents brute-force and spam.
 * 2. Constant-time secret comparison — prevents timing side-channel attacks.
 * 3. Cooldown deduplication — prevents re-triggering expensive jobs.
 * 4. Audit logging — logs the outcome for forensic analysis.
 *
 * Usage:
 *   router.post("/dispatch-notifications", requireCronSecret, asyncHandler(handler));
 *
 * Expects the secret in the `Authorization: Bearer <CRON_SECRET>` header.
 */
export const requireCronSecret = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET;

  auditLog(req, res, "CRON");

  if (!cronSecret) {
    console.error("[security] CRON_SECRET is not configured. Rejecting cron request.");
    next(new HttpError(503, "Cron endpoint is not configured."));
    return;
  }

  // Layer 1: Rate limiting
  const clientIp = req.socket?.remoteAddress || req.ip || "unknown";
  if (isBackgroundRateLimited(clientIp)) {
    next(new HttpError(429, "Too many requests to cron endpoint. Please wait."));
    return;
  }

  // Layer 2: Constant-time secret comparison (prevents timing attacks)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new HttpError(401, "Authentication required."));
    return;
  }

  const providedSecret = authHeader.slice(7);

  // Both buffers must be the same length for timingSafeEqual.
  // Hash both to normalize length and add an extra layer of protection.
  const expectedHash = crypto.createHash("sha256").update(cronSecret).digest();
  const providedHash = crypto.createHash("sha256").update(providedSecret).digest();

  if (!crypto.timingSafeEqual(expectedHash, providedHash)) {
    next(new HttpError(403, "Invalid cron secret."));
    return;
  }

  // Layer 3: Cooldown deduplication
  const routeKey = `${req.method}:${req.originalUrl}`;
  if (isOnCooldown(routeKey)) {
    next(new HttpError(429, "This job was executed recently. Please wait before re-triggering."));
    return;
  }

  next();
};
