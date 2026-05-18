import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Notification } from "./types";
import { showBrowserNotification } from "./pushNotifications";

const PAGE_SIZE = 20;

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const fetchNotifications = useCallback(
    async (nextPage = 0) => {
      if (!userId) {
        setNotifications([]);
        setHasMore(false);
        return;
      }

      setLoading(true);

      const from = nextPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Failed to fetch notifications:", error);
        setLoading(false);
        return;
      }

      setNotifications((current) =>
        nextPage === 0 ? data || [] : [...current, ...(data || [])]
      );
      setPage(nextPage);
      setHasMore((data?.length || 0) === PAGE_SIZE);
      setLoading(false);
    },
    [userId]
  );

  const markAsRead = useCallback(async (id: string) => {
    let previous: Notification[] = [];

    setNotifications((current) => {
      previous = current;
      return current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      );
    });

    const { error } = await (supabase as any)
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      console.error("Failed to mark notification as read:", error);
      setNotifications(previous);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    let previous: Notification[] = [];

    setNotifications((current) => {
      previous = current;
      return current.map((notification) => ({ ...notification, read: true }));
    });

    const { error } = await (supabase as any)
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Failed to mark all notifications as read:", error);
      setNotifications(previous);
    }
  }, [userId]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1);
    }
  }, [fetchNotifications, hasMore, loading, page]);

  useEffect(() => {
    fetchNotifications(0);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as Notification;

          setNotifications((current) => {
            if (current.some((notification) => notification.id === incoming.id)) {
              return current;
            }

            return [incoming, ...current];
          });

          showBrowserNotification(
            incoming.title,
            incoming.body,
            incoming.action_url || "/notifications"
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;

          setNotifications((current) =>
            current.map((notification) =>
              notification.id === updated.id ? updated : notification
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("Notification realtime channel error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh: () => fetchNotifications(0),
  };
}
