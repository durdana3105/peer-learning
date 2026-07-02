import crypto from "crypto";
import { HttpError } from "../utils/httpError.js";

/**
 * Dedicated rate limiter for cron/webhook endpoints.
 * Much stricter than user-facing rate limits since these endpoints
 * trigger expensive bulk operations (DB queries, push notifications).
 */
const BACKGROUND_WINDOW_MS = 60_000;
const BACKGROUND_MAX_REQUESTS = 5;

/**
 * Factory that returns an independent rate-limiter closure backed by its
 * own Map instance. Callers (cron routes, notification routes) must each
 * call createBackgroundRateLimiter() to get an isolated limiter so that
 * one endpoint's traffic cannot exhaust another's budget.
 *
 * @param {number} windowMs   - Rolling window duration in ms (default 60 000)
 * @param {number} maxRequests - Max allowed requests per window (default 5)
 * @returns {(ip: string) => boolean}
 */
export const createBackgroundRateLimiter = (
  windowMs = BACKGROUND_WINDOW_MS,
  maxRequests = BACKGROUND_MAX_REQUESTS
) => {
  const counts = new Map();

  return (ip) => {
    const now = Date.now();
    const entry = counts.get(ip);

    if (!entry || now - entry.windowStart >= windowMs) {
      counts.set(ip, { count: 1, windowStart: now });
      return false;
    }

    if (entry.count >= maxRequests) {
      return true;
    }

    entry.count += 1;
    return false;
  };
};

/**
 * Factory that returns an independent cooldown-tracker closure backed by
 * its own Map instance. Same isolation rationale as createBackgroundRateLimiter.
 *
 * @param {number} cooldownMs - Minimum interval between executions (default 60 000)
 * @returns {(routeKey: string) => boolean}
 */
export const createCooldownTracker = (cooldownMs = 60_000) => {
  const lastExecutions = new Map();

  return (routeKey) => {
    const now = Date.now();
    const lastRun = lastExecutions.get(routeKey);

    if (lastRun && now - lastRun < cooldownMs) {
      return true;
    }

    lastExecutions.set(routeKey, now);
    return false;
  };
};

// ── Cron-route instances (used by requireCronSecret below) ────────────────────────
const cronRateLimiter = createBackgroundRateLimiter();
const cronCooldown = createCooldownTracker();

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

  // Layer 1: Rate limiting — uses cron-private limiter instance
  const clientIp = req.socket?.remoteAddress || req.ip || "unknown";
  if (cronRateLimiter(clientIp)) {
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

  const expectedHash = crypto.createHash("sha256").update(cronSecret).digest();
  const providedHash = crypto.createHash("sha256").update(providedSecret).digest();

  if (!crypto.timingSafeEqual(expectedHash, providedHash)) {
    next(new HttpError(403, "Invalid cron secret."));
    return;
  }

  // Layer 3: Cooldown deduplication — uses cron-private cooldown instance
  const routeKey = `${req.method}:${req.originalUrl}`;
  if (cronCooldown(routeKey)) {
    next(new HttpError(429, "This job was executed recently. Please wait before re-triggering."));
    return;
  }

  next();
};