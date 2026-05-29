import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ScheduledSession {
  id: number;
  title: string | null;
  description: string | null;
  scheduled_at: string | null;
  duration_minutes: number;
  status: string;
  mentor_id: string | null;
  student_id: string | null;
  tags: string[] | null;
  created_at: string;
}

/**
 * Returns ms remaining until 5 min before scheduled_at.
 * Negative = join window is open (or session is live).
 */
export function msUntilJoinWindow(scheduledAt: string): number {
  const start = new Date(scheduledAt).getTime();
  const joinOpens = start - 5 * 60 * 1000; // 5 min before
  return joinOpens - Date.now();
}

/**
 * Formats ms remaining as "Xh Ym" or "Xm Ys".
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return "Join now";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Fetches all sessions, subscribes to Supabase realtime changes,
 * and periodically calls tick_session_statuses() to auto-advance
 * scheduled → live → ended.
 */
export function useSessions() {
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("scheduled_at", { ascending: true });

    if (!error && data) {
      setSessions(data as ScheduledSession[]);
    }
    setLoading(false);
  }, []);

  // Tick statuses on the server (scheduled→live, live→ended)
  const tick = useCallback(async () => {
    await supabase.rpc("tick_session_statuses");
  }, []);

  useEffect(() => {
    fetchSessions();

    // Tick immediately then every 30 s
    tick();
    const tickInterval = setInterval(tick, 30_000);

    // Realtime subscription
    const channel = supabase
      .channel("sessions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSessions((prev) =>
              [...prev, payload.new as ScheduledSession].sort(
                (a, b) =>
                  new Date(a.scheduled_at ?? 0).getTime() -
                  new Date(b.scheduled_at ?? 0).getTime()
              )
            );
          } else if (payload.eventType === "UPDATE") {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === (payload.new as ScheduledSession).id
                  ? (payload.new as ScheduledSession)
                  : s
              )
            );
          } else if (payload.eventType === "DELETE") {
            setSessions((prev) =>
              prev.filter((s) => s.id !== (payload.old as ScheduledSession).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(tickInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchSessions, tick]);

  return { sessions, loading, refetch: fetchSessions };
}

/**
 * Live countdown hook — re-renders every second.
 */
export function useCountdown(scheduledAt: string | null) {
  const [ms, setMs] = useState(() =>
    scheduledAt ? msUntilJoinWindow(scheduledAt) : Infinity
  );

  useEffect(() => {
    if (!scheduledAt) return;
    const id = setInterval(() => {
      setMs(msUntilJoinWindow(scheduledAt));
    }, 1000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  return ms;
}
