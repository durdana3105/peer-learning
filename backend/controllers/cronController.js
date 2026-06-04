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

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id,user_id,title,body,action_url")
      .is("push_sent_at", null)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!notifications || notifications.length === 0) {
      return res.json({ sent: 0, processed: 0 });
    }

    let sent = 0;

    for (const notification of notifications) {
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("endpoint,p256dh,auth")
        .eq("user_id", notification.user_id);

      const pushResults = await Promise.allSettled(
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
              title: notification.title,
              body: notification.body,
              action_url: notification.action_url || "/notifications",
            })
          )
        )
      );

      sent += pushResults.filter((result) => result.status === "fulfilled").length;

      await supabase
        .from("notifications")
        .update({ push_sent_at: new Date().toISOString() })
        .eq("id", notification.id);
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
      .eq("status", "upcoming")
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
    
    // Find milestones due in the next 24 hours or overdue, that are not completed
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
      .lte("due_date", tomorrow);

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
