import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { sanitizeNotificationActionUrl } from "../utils/notificationActionUrl.js";
import { collectExpiredSubscriptionIds } from "../utils/pushDeliveryCleanup.js";

const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey);
};

export const sendPushNotification = async (req, res, next) => {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return res.status(500).json({ error: "Missing VAPID push server env" });
    }

    // Auth is already handled by either requireAuth or webhookSecret middleware in the route.
    // Assuming requireAuth sets req.user

    const { user_id, title, body, action_url } = req.body;

    if (!user_id || !title || !body) {
      return res.status(400).json({
        error: "user_id, title, and body are required",
      });
    }
    if (
      typeof user_id !== "string" ||
      typeof title !== "string" ||
      typeof body !== "string"
    ) {
      return res.status(400).json({
        error: "Invalid request payload",
      });
    }
    if (title.length > 100 || body.length > 500) {
      return res.status(400).json({
        error: "Notification content too long",
      });
    }

    // Security Fix: Prevent IDOR. Enforce that standard users can only send push notifications to themselves.
    // If a webhook secret is used, req.user will be undefined (which bypasses this check if we allow webhooks to send to anyone).
    // If user auth is used, req.user is set.
    const isAdmin = req.user?.role === "admin" || req.user?.app_metadata?.role === "admin" || req.roles?.includes("admin");
    if (req.user?.id && req.user.id !== user_id && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to send push notifications to this user" });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const supabase = getSupabaseClient();
    const safeActionUrl = sanitizeNotificationActionUrl(action_url);

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", user_id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    if (!subscriptions?.length) {
      return res.status(404).json({
        error: "No push subscriptions found for this user",
      });
    }

    const results = await Promise.allSettled(
      (subscriptions || []).map((subscription) =>
        webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title,
            body,
            action_url: safeActionUrl,
          })
        )
      )
    );

    // Shared with the cron dispatch path (fixes #1676: cleanup used to only
    // live here, not in dispatchPushNotifications).
    const expiredIds = collectExpiredSubscriptionIds(subscriptions, results);
    if (expiredIds.size > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", [...expiredIds]);
    }

    res.json({
      sent: results.filter((result) => result.status === "fulfilled").length,
      failed: results.filter((result) => result.status === "rejected").length,
    });
  } catch (error) {
    next(error);
  }
};