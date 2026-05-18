import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase server env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = Date.now();
  const windowStart = new Date(now + 14 * 60 * 1000).toISOString();
  const windowEnd = new Date(now + 16 * 60 * 1000).toISOString();

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(
      `
      id,
      title,
      start_time,
      mentor_id,
      session_participants (
        user_id
      )
    `
    )
    .eq("status", "upcoming")
    .gte("start_time", windowStart)
    .lte("start_time", windowEnd);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const notifications =
    sessions?.flatMap((session) => {
      const participantIds = new Set<string>();

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
    return new Response(JSON.stringify({ inserted: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error: insertError } = await supabase
    .from("notifications")
    .upsert(notifications, {
      onConflict: "user_id,entity_id,type",
      ignoreDuplicates: true,
    });

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ inserted: notifications.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
