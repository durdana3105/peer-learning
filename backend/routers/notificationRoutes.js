import express from "express";
import crypto from "crypto";
import { sendPushNotification } from "../controllers/notificationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import {
  auditLog,
  createBackgroundRateLimiter,
  createCooldownTracker,
} from "../middlewares/requireCronSecret.js";

const router = express.Router();

// ── Notification-route private limiter instances ───────────────────────────────────
// These are completely independent of the cron-route instances created inside
// requireCronSecret.js — each call to the factory allocates a new Map, so
// traffic on /api/notifications/* cannot exhaust the budget for /api/cron/*
// and vice versa.
const notificationRateLimiter = createBackgroundRateLimiter();
const notificationCooldown = createCooldownTracker();

/*
 * verifyNotificationAuth
 *
 * Secures /api/notifications/send-push with the WEBHOOK_SECRET.
 *
 * This is a SEPARATE secret from CRON_SECRET (used on /api/cron/*).
 * The distinction is intentional:
 *
 *   CRON_SECRET    — held by the scheduler (Vercel Cron / pg_cron).
 *   WEBHOOK_SECRET — held by trusted internal services or admin tooling.
 *
 * Keeping them separate means a compromised scheduler secret does not grant
 * arbitrary single-user push access, and vice versa.
 */
const verifyNotificationAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    return next(new HttpError(500, "Webhook secret is not configured on the server"));
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const providedSecret = authHeader.slice(7);

    const expectedHash = crypto.createHash("sha256").update(webhookSecret).digest();
    const providedHash = crypto.createHash("sha256").update(providedSecret).digest();

    if (crypto.timingSafeEqual(expectedHash, providedHash)) {
      auditLog(req, res, "WEBHOOK");

      const clientIp = req.socket?.remoteAddress || req.ip || "unknown";
      if (notificationRateLimiter(clientIp)) {
        return next(new HttpError(429, "Too many requests to webhook endpoint. Please wait."));
      }

      const routeKey = `${req.method}:${req.originalUrl}`;
      if (notificationCooldown(routeKey)) {
        return next(new HttpError(429, "This job was executed recently. Please wait before re-triggering."));
      }

      return next();
    }
  }

  return next(new HttpError(401, "Unauthorized webhook access"));
};

router.post("/send-push", verifyNotificationAuth, asyncHandler(sendPushNotification));

export default router;