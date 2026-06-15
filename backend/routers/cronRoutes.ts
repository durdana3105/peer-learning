import express from "express";
import { requireCronSecret } from "../middlewares/requireCronSecret.js";
import {
  dispatchPushNotifications,
  sendSessionReminders,
  sendMentorshipCheckinReminders,
} from "../controllers/cronController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

/**
 * POST /api/cron/dispatch-notifications
 *
 * Secured with:
 *   - Constant-time secret verification (anti-timing attack)
 *   - Dedicated rate limiter (5 req/min per IP)
 *   - 60-second cooldown deduplication
 *
 * Dispatches pending push notifications to subscribed users.
 */
router.post(
  "/dispatch-notifications",
  requireCronSecret,
  asyncHandler(dispatchPushNotifications)
);

router.post(
  "/reminders",
  requireCronSecret,
  asyncHandler(sendSessionReminders)
);

router.post(
  "/mentorship-reminders",
  requireCronSecret,
  asyncHandler(sendMentorshipCheckinReminders)
);

export default router;
