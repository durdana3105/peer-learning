import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  action_url: string | null;
};

type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: "Missing push server env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id,user_id,title,body,action_url")
    .is("push_sent_at", null)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = (notifications || []) as NotificationRow[];

  if (rows.length === 0) {
    return new Response(JSON.stringify({ sent: 0, processed: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let sent = 0;

  for (const notification of rows) {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth")
      .eq("user_id", notification.user_id);

    const pushResults = await Promise.allSettled(
      ((subscriptions || []) as PushSubscriptionRow[]).map((subscription) =>
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

  return new Response(JSON.stringify({ sent, processed: rows.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
