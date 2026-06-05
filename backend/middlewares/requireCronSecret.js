import crypto from "crypto";
import { HttpError } from "../utils/httpError.js";

/**
 * Dedicated rate limiter for cron/webhook endpoints.
 * Much stricter than user-facing rate limits since these endpoints
 * trigger expensive bulk operations (DB queries, push notifications).
 */
const CRON_WINDOW_MS = 60_000;
const CRON_MAX_REQUESTS = 5;
const cronRateCounts = new Map();

const isCronRateLimited = (ip) => {
  const now = Date.now();
  const entry = cronRateCounts.get(ip);

  if (!entry || now - entry.windowStart >= CRON_WINDOW_MS) {
    cronRateCounts.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= CRON_MAX_REQUESTS) {
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

const isOnCooldown = (routeKey) => {
  const now = Date.now();
  const lastRun = lastExecutions.get(routeKey);

  if (lastRun && now - lastRun < COOLDOWN_MS) {
    return true;
  }

  lastExecutions.set(routeKey, now);
  return false;
};

/**
 * Express middleware that secures cron/webhook endpoints with three layers:
 *
 * 1. Rate limiting (5 req/min per IP) — prevents brute-force and spam.
 * 2. Constant-time secret comparison — prevents timing side-channel attacks.
 * 3. Cooldown deduplication — prevents re-triggering expensive jobs.
 *
 * Usage:
 *   router.post("/dispatch-notifications", requireCronSecret, asyncHandler(handler));
 *
 * Expects the secret in the `Authorization: Bearer <CRON_SECRET>` header.
 */
export const requireCronSecret = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[security] CRON_SECRET is not configured. Rejecting cron request.");
    next(new HttpError(503, "Cron endpoint is not configured."));
    return;
  }

  // Layer 1: Rate limiting
  const clientIp = req.socket?.remoteAddress || req.ip || "unknown";
  if (isCronRateLimited(clientIp)) {
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
