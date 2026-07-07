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

// After this long, an unfinished claim is considered abandoned (the process
// crashed, or every subscription failed for this notification) and becomes
// eligible to be reclaimed and retried by a future cron run.
export const PUSH_CLAIM_TTL_MS = 5 * 60 * 1000;

// After this many failed attempts, stop retrying and stamp push_failed_at so
// the row is permanently excluded from future claim queries.
export const MAX_PUSH_ATTEMPTS = 5;

/*
 * dispatchPushNotifications
 *
 * Bulk-delivers pending push notifications to subscribed browsers.
 *
 * Batch cap: fetches at most 100 rows per invocation. A notification backlog
 * drains at 100 rows/minute assuming a 1-minute cron schedule. If queue depth
 * grows faster than this, trigger additional manual runs (after the
 * PUSH_CLAIM_TTL_MS cooldown, if the rows are currently claimed) or mark
 * stale rows sent via SQL — see docs/smart-notifications.md → "Manual drain
 * procedure".
 *
 * Retry / claim-expiry (fixes #1676): a row is claimable when it has never
 * been sent, hasn't permanently failed, and is either unclaimed or its claim
 * is older than PUSH_CLAIM_TTL_MS. Previously a claimed row that failed for
 * every subscription kept push_claimed_at set forever with no push_sent_at,
 * so it was claimed exactly once and never retried. Now:
 *   - a fully-failed attempt increments push_attempts and leaves the row
 *     claimed; it becomes reclaimable once the claim ages past the TTL.
 *   - once push_attempts reaches MAX_PUSH_ATTEMPTS, push_failed_at is set and
 *     the row is permanently excluded from the claim query.
 *   - a notification with zero subscriptions fails fast (push_failed_at set
 *     immediately) since retrying can never help.
 *
 * Failure absorption: Promise.allSettled is used intentionally so that a
 * single failing push (network error, expired subscription) does not block
 * delivery to other recipients. The `sent` vs `processed` delta in the
 * response reflects failures.
 *
 * Subscription expiry (HTTP 410 / 404): the web-push library returns a
 * rejection with `statusCode 410` (subscription expired) or `404` (endpoint
 * not found) when a browser unsubscribes or revokes permission. These
 * subscriptions are deleted from `push_subscriptions` via the shared
 * collectExpiredSubscriptionIds helper (also used by sendPushNotification in
 * notificationController.js) to avoid accumulating dead endpoints.
 *
 * @route   POST /api/cron/dispatch-notifications
 * @access  CRON_SECRET (Authorization: Bearer)
 * @returns {{ sent: number, processed: number }}
 */

export const dispatchPushNotifications = async (req, res, next) => {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return res.status(500).json({ error: "Missing VAPID push server env" });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    const supabase = getSupabaseClient();

    // Atomically claim a batch of pending notifications so concurrent
    // invocations cannot double-deliver the same notification, while also
    // allowing rows whose previous claim has expired to be reclaimed.
    const claimedAt = new Date();
    const claimExpiryThreshold = new Date(claimedAt.getTime() - PUSH_CLAIM_TTL_MS).toISOString();

    const { data: notifications, error: claimError } = await supabase
      .from("notifications")
      .update({ push_claimed_at: claimedAt.toISOString() })
      .is("push_sent_at", null)
      .is("push_failed_at", null)
      .or(`push_claimed_at.is.null,push_claimed_at.lt.${claimExpiryThreshold}`)
      .select("id,user_id,title,body,action_url,push_attempts")
      .limit(100);

    if (claimError) {
      return res.status(500).json({ error: claimError.message });
    }

    if (!notifications || notifications.length === 0) {
      return res.json({ sent: 0, processed: 0 });
    }

    // Batch-fetch all push subscriptions for the claimed notifications in one query.
    const userIds = [...new Set(notifications.map((n) => n.user_id))];
    const { data: allSubscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("id,user_id,endpoint,p256dh,auth")
      .in("user_id", userIds);

    if (subError) {
      const notificationIds = notifications.map((n) => n.id);
      if (notificationIds.length > 0) {
        const { error: rollbackError } = await supabase
          .from("notifications")
          .update({ push_claimed_at: null })
          .in("id", notificationIds);
        if (rollbackError) {
          return res.status(500).json({
            error: `Subscription fetch failed, and rollback failed: ${rollbackError.message}`,
          });
        }
      }
      return res.status(500).json({ error: subError.message });
    }

    // Group subscriptions by user_id for O(1) lookup per notification.
    const subsByUser = {};
    for (const sub of allSubscriptions || []) {
      if (!subsByUser[sub.user_id]) subsByUser[sub.user_id] = [];
      subsByUser[sub.user_id].push(sub);
    }

    let sent = 0;
    const expiredSubscriptionIds = new Set();

    for (const notification of notifications) {
      const subscriptions = subsByUser[notification.user_id] || [];

      const pushResults = await Promise.allSettled(
        subscriptions.map((subscription) =>
          webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            JSON.stringify({
              title: notification.title,
              body: notification.body,
              action_url: sanitizeNotificationActionUrl(notification.action_url),
            })
          )
        )
      );

      for (const id of collectExpiredSubscriptionIds(subscriptions, pushResults)) {
        expiredSubscriptionIds.add(id);
      }

      const anySucceeded = pushResults.some((r) => r.status === "fulfilled");
      sent += pushResults.filter((r) => r.status === "fulfilled").length;

      if (anySucceeded) {
        // push_sent_at now non-null → excluded from all future claim queries.
        await supabase
          .from("notifications")
          .update({ push_sent_at: new Date().toISOString() })
          .eq("id", notification.id);
      } else if (subscriptions.length === 0) {
        // No subscriptions to deliver to at all — retrying can never help,
        // so give up immediately instead of occupying a claim/retry cycle.
        await supabase
          .from("notifications")
          .update({ push_failed_at: new Date().toISOString() })
          .eq("id", notification.id);
      } else {
        // Every subscription failed for this attempt. Record it; give up
        // permanently once MAX_PUSH_ATTEMPTS is reached, otherwise leave
        // push_claimed_at as-is — it becomes reclaimable once it ages past
        // PUSH_CLAIM_TTL_MS.
        const attempts = (notification.push_attempts || 0) + 1;
        const update =
          attempts >= MAX_PUSH_ATTEMPTS
            ? { push_attempts: attempts, push_failed_at: new Date().toISOString() }
            : { push_attempts: attempts };
        await supabase.from("notifications").update(update).eq("id", notification.id);
      }
    }

    if (expiredSubscriptionIds.size > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("id", [...expiredSubscriptionIds]);
    }

    res.json({ sent, processed: notifications.length });
  } catch (error) {
    next(error);
  }
};

export const sendSessionReminders = async (req, res, next) => {
  try {
    const supabase = getSupabaseClient();
    const now = Date.now();
    const windowStart = new Date(now + 14 * 60 * 1000).toISOString();
    const windowEnd = new Date(now + 16 * 60 * 1000).toISOString();

    const { data: sessions, error } = await supabase
      .from("sessions")
      .select(`
        id,
        title,
        start_time,
        mentor_id,
        session_participants (
          user_id
        )
      `)
      .eq("status", "scheduled")
      .gte("start_time", windowStart)
      .lte("start_time", windowEnd);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const notifications =
      sessions?.flatMap((session) => {
        const participantIds = new Set();

        if (session.mentor_id) {
          participantIds.add(session.mentor_id);
        }

        for (const participant of session.session_participants || []) {
          if (participant.user_id) {
            participantIds.add(participant.user_id);
          }
        }

        return [...participantIds].map((userId) => ({
          user_id: userId,
          type: "session_reminder",
          title: "Session starting soon",
          body: `${session.title} starts in about 15 minutes.`,
          entity_id: session.id,
          action_url: "/sessions",
        }));
      }) ?? [];
    const safeNotifications = notifications.map((notification) => ({
      ...notification,
      action_url: sanitizeNotificationActionUrl(notification.action_url),
    }));

    if (safeNotifications.length === 0) {
      return res.json({ inserted: 0 });
    }

    const { error: insertError } = await supabase
      .from("notifications")
      .upsert(safeNotifications, {
        onConflict: "user_id,entity_id,type",
        ignoreDuplicates: true,
      });

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.json({ inserted: safeNotifications.length });
  } catch (error) {
    next(error);
  }
};

export const sendMentorshipCheckinReminders = async (req, res, next) => {
  try {
    const supabase = getSupabaseClient();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    // Lower bound: only look back 7 days to avoid reprocessing ancient overdue
    // milestones on every cron run. This prevents unbounded query growth while
    // still notifying users about recently overdue items. Adjustable if needed.
    const lookbackDays = 7;
    const windowStart = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    // Find milestones due within the bounded window [7 days ago … tomorrow]
    const { data: milestones, error } = await supabase
      .from("mentorship_milestones")
      .select(`
        id,
        title,
        due_date,
        mentorship_paths (
          id,
          mentor_id,
          mentee_id,
          goal
        )
      `)
      .eq("is_completed", false)
      .not("due_date", "is", null)
      .gte("due_date", windowStart)
      .lte("due_date", tomorrow)
      .order("due_date", { ascending: true })
      .limit(500);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const notifications = [];
    for (const m of milestones || []) {
      const path = m.mentorship_paths;
      if (!path) continue;

      const isOverdue = new Date(m.due_date) < now;
      const title = isOverdue ? "Milestone Overdue" : "Milestone Due Soon";
      const type = isOverdue ? "mentorship_reminder_overdue" : "mentorship_reminder";
      const body = `The milestone "${m.title}" for goal "${path.goal}" is ${isOverdue ? 'overdue' : 'due soon'}. Check in with your mentor/mentee!`;

      // Notify mentor
      notifications.push({
        user_id: path.mentor_id,
        type,
        title,
        body,
        entity_id: m.id,
        action_url: "/dashboard", // MentorDashboard
      });

      // Notify mentee
      notifications.push({
        user_id: path.mentee_id,
        type,
        title,
        body,
        entity_id: m.id,
        action_url: "/dashboard", // LearnerDashboard
      });
    }

    const safeNotifications = notifications.map((notification) => ({
      ...notification,
      action_url: sanitizeNotificationActionUrl(notification.action_url),
    }));

    if (safeNotifications.length === 0) {
      return res.json({ inserted: 0 });
    }

    const { error: insertError } = await supabase
      .from("notifications")
      .upsert(safeNotifications, {
        onConflict: "user_id,entity_id,type",
        ignoreDuplicates: true,
      });

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.json({ inserted: safeNotifications.length });
  } catch (error) {
    next(error);
  }
};

export const resetWeeklyFocusTime = async (req, res, next) => {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("profiles")
      .update({ focus_time_this_week: 0 })
      .neq("focus_time_this_week", 0);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ reset: true });
  } catch (error) {
    next(error);
  }
};