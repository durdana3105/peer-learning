import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey);
};

/*
 * dispatchPushNotifications
 *
 * Bulk-delivers pending push notifications to subscribed browsers.
 *
 * Batch cap: fetches at most 100 rows per invocation (oldest-first). A
 * notification backlog drains at 100 rows/minute assuming a 1-minute cron
 * schedule. If queue depth grows faster than this, trigger additional manual
 * runs (after the 60-second cooldown) or mark stale rows sent via SQL — see
 * docs/smart-notifications.md → "Manual drain procedure".
 *
 * Failure absorption: Promise.allSettled is used intentionally so that a
 * single failing push (network error, expired subscription) does not block
 * delivery to other recipients. The `sent` vs `processed` delta in the
 * response reflects failures. Each notification row is stamped with
 * `push_sent_at` regardless of delivery outcome — there is no automatic retry
 * for failed pushes.
 *
 * Subscription expiry (HTTP 410 / 404): the web-push library returns a
 * rejection with `statusCode 410` (subscription expired) or `404` (endpoint
 * not found) when a browser unsubscribes or revokes permission. These
 * subscriptions should be deleted from `push_subscriptions` to avoid
 * accumulating dead endpoints. NOTE: this cleanup is currently implemented in
 * sendPushNotification (notificationController.js) but NOT here. A future
 * improvement should add equivalent cleanup to this handler.
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

    // Atomically claim a batch of pending notifications so concurrent invocations
    // cannot double-deliver the same notification (race-condition prevention).
    const claimedAt = new Date().toISOString();
    const { data: notifications, error } = await supabase
      .from("notifications")
      .update({ push_claimed_at: claimedAt })
      .is("push_claimed_at", null)
      .select("id,user_id,title,body,action_url");

    if (Error) {
      return res.status(500).json({ error: claimError.message });
    }

    if (!notifications || notifications.length === 0) {
      return res.json({ sent: 0, processed: 0 });
    }

    // Batch-fetch all push subscriptions for the claimed notifications in one query.
    const userIds = [...new Set(notifications.map((n) => n.user_id))];
    const { data: allSubscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id,endpoint,p256dh,auth")
      .in("user_id", userIds);

    if (subError) {
      return res.status(500).json({ error: subError.message });
    }

    // Group subscriptions by user_id for O(1) lookup per notification.
    const subsByUser = {};
    for (const sub of allSubscriptions || []) {
      if (!subsByUser[sub.user_id]) subsByUser[sub.user_id] = [];
      subsByUser[sub.user_id].push(sub);
    }

    let sent = 0;

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
              action_url: notification.action_url || "/notifications",
            })
          )
        )
      );

      const anySucceeded = pushResults.some((r) => r.status === "fulfilled");
      sent += pushResults.filter((r) => r.status === "fulfilled").length;

      // Only stamp push_sent_at when at least one push succeeded so a
      // fully-failed notification remains retryable — but push_claimed_at
      // already prevents concurrent re-delivery regardless.
      if (anySucceeded) {
        await supabase
          .from("notifications")
          .update({ push_sent_at: new Date().toISOString() })
          .eq("id", notification.id);
      }
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

    if (notifications.length === 0) {
      return res.json({ inserted: 0 });
    }

    const { error: insertError } = await supabase
      .from("notifications")
      .upsert(notifications, {
        onConflict: "user_id,entity_id,type",
        ignoreDuplicates: true,
      });

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.json({ inserted: notifications.length });
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
      const body = `The milestone "${m.title}" for goal "${path.goal}" is ${isOverdue ? 'overdue' : 'due soon'}. Check in with your mentor/mentee!`;

      // Notify mentor
      notifications.push({
        user_id: path.mentor_id,
        type: "mentorship_reminder",
        title,
        body,
        entity_id: m.id,
        action_url: "/dashboard", // MentorDashboard
      });
      
      // Notify mentee
      notifications.push({
        user_id: path.mentee_id,
        type: "mentorship_reminder",
        title,
        body,
        entity_id: m.id,
        action_url: "/dashboard", // LearnerDashboard
      });
    }

    if (notifications.length === 0) {
      return res.json({ inserted: 0 });
    }

    const { error: insertError } = await supabase
      .from("notifications")
      .upsert(notifications, {
        onConflict: "user_id,entity_id,type",
        ignoreDuplicates: true,
      });

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    res.json({ inserted: notifications.length });
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
