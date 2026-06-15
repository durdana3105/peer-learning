import express from "express";
import crypto from "crypto";
import { sendPushNotification } from "../controllers/notificationController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import {
  auditLog,
  isBackgroundRateLimited,
  isOnCooldown,
} from "../middlewares/requireCronSecret.js";

const router = express.Router();

/*
 * verifyNotificationAuth
 *
 * Secures /api/notifications/send-push with the WEBHOOK_SECRET.
 *
 * This is a SEPARATE secret from CRON_SECRET (used on /api/cron/*).
 * The distinction is intentional:
 *
 *   CRON_SECRET  — held by the scheduler (Vercel Cron / pg_cron). Authorises
 *                  bulk operations that touch up to 100 rows per call.
 *
 *   WEBHOOK_SECRET — held by trusted internal services or admin tooling.
 *                    Authorises single-user targeted push delivery.
 *
 * Keeping them separate means a compromised scheduler secret does not grant
 * arbitrary single-user push access, and vice versa. Both can be rotated
 * independently — see docs/smart-notifications.md → "Secrets Reference".
 *
 * Applies the same rate-limit and cooldown helpers as requireCronSecret to
 * prevent abuse via this endpoint too.
 */

// Custom middleware to strictly verify WEBHOOK secret
const verifyNotificationAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    return next(new HttpError(500, "Webhook secret is not configured on the server"));
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const providedSecret = authHeader.slice(7);

    // Both buffers must be the same length for timingSafeEqual.
    const expectedHash = crypto.createHash("sha256").update(webhookSecret).digest();
    const providedHash = crypto.createHash("sha256").update(providedSecret).digest();

    if (crypto.timingSafeEqual(expectedHash, providedHash)) {
      // Valid webhook secret
      auditLog(req, res, "WEBHOOK");

      const clientIp = req.socket?.remoteAddress || req.ip || "unknown";
      if (isBackgroundRateLimited(clientIp)) {
        return next(new HttpError(429, "Too many requests to webhook endpoint. Please wait."));
      }

      const routeKey = `${req.method}:${req.originalUrl}`;
      if (isOnCooldown(routeKey)) {
        return next(new HttpError(429, "This job was executed recently. Please wait before re-triggering."));
      }

      return next();
    }
  }

  return next(new HttpError(401, "Unauthorized webhook access"));
};

router.post("/send-push", verifyNotificationAuth, asyncHandler(sendPushNotification));

export default router;
