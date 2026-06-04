import express from "express";
import { sendPushNotification } from "../controllers/notificationController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Custom middleware to support both CRON/WEBHOOK secret and user auth
const verifyNotificationAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (webhookSecret && authHeader === `Bearer ${webhookSecret}`) {
    return next();
  }

  // Fallback to standard user auth
  return requireAuth(req, res, next);
};

router.post("/send-push", verifyNotificationAuth, asyncHandler(sendPushNotification));

export default router;
