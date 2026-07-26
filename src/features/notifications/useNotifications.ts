 
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Notification } from "./types";
import { showBrowserNotification } from "./pushNotifications";
import { sanitizeNotificationActionUrl } from "./actionUrl";

const PAGE_SIZE = 20;

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    const { count, error } = await (supabase as any)
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Failed to fetch unread notification count:", error);
      return;
    }

    setUnreadCount(count || 0);
  }, [userId]);

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

  const markAsRead = useCallback(
    async (id: string) => {
      let previous: Notification[] = [];
      let wasUnread = false;

      setNotifications((current) => {
        previous = current;
        const target = current.find((notification) => notification.id === id);
        wasUnread = !!target && !target.read;
        return current.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        );
      });

      if (wasUnread) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }

      const { error } = await (supabase as any)
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) {
        console.error("Failed to mark notification as read:", error);
        setNotifications(previous);
        if (wasUnread) {
          setUnreadCount((current) => current + 1);
        }
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    let previous: Notification[] = [];
    const previousUnreadCount = unreadCount;

    setNotifications((current) => {
      previous = current;
      return current.map((notification) => ({ ...notification, read: true }));
    });
    setUnreadCount(0);

    const { error } = await (supabase as any)
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) {
      console.error("Failed to mark all notifications as read:", error);
      setNotifications(previous);
      setUnreadCount(previousUnreadCount);
    }
  }, [userId, unreadCount]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1);
    }
  }, [fetchNotifications, hasMore, loading, page]);

  useEffect(() => {
    fetchNotifications(0);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

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

          // Re-fetch the authoritative unread count rather than incrementing
          // locally, since the loaded page may not include every notification.
          fetchUnreadCount();

          // Check focus mode before showing popup
          supabase.from('profiles').select('is_in_focus_mode').eq('id', userId).single().then(({ data }) => {
            if (!data?.is_in_focus_mode) {
              showBrowserNotification(
                incoming.title,
                incoming.body,
                sanitizeNotificationActionUrl(incoming.action_url)
              );
            }
          });
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

          // The read/unread status may have changed on a row outside the
          // loaded page (or from another client/tab), so re-sync the count.
          fetchUnreadCount();
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
  }, [userId, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh: () => {
      fetchNotifications(0);
      fetchUnreadCount();
    },
  };
}