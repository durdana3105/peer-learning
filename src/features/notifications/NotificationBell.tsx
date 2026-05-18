import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "./useNotifications";
import {
  isBrowserNotificationSupported,
  registerBrowserPush,
} from "./pushNotifications";

interface NotificationBellProps {
  userId?: string;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<"idle" | "enabled" | "denied" | "unsupported">("idle");
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    markAllAsRead,
    loadMore,
  } = useNotifications(userId);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  if (!userId) return null;

  const enablePush = async () => {
    const result = await registerBrowserPush(userId);

    if (!result.ok && result.reason === "permission-denied") {
      setPushStatus("denied");
      return;
    }

    if (!result.ok && result.reason === "unsupported") {
      setPushStatus("unsupported");
      return;
    }

    setPushStatus("enabled");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-xl border border-white/10 bg-white/5 p-3 text-white transition hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell size={18} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[70] mt-3 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#050816] text-white shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Notifications</h2>
              <p className="text-xs text-gray-400">
                {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
              </p>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cyan-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck size={14} />
              Mark all
            </button>
          </div>

          {isBrowserNotificationSupported() && Notification.permission !== "granted" && (
            <div className="border-b border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={enablePush}
                className="w-full rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Enable browser alerts
              </button>
              {pushStatus === "denied" && (
                <p className="mt-2 text-xs text-red-300">
                  Browser notifications are blocked. Enable them in site settings.
                </p>
              )}
              {pushStatus === "unsupported" && (
                <p className="mt-2 text-xs text-gray-400">
                  Browser notifications are not supported here.
                </p>
              )}
            </div>
          )}

          {pushStatus === "enabled" && (
            <div className="border-b border-white/10 px-4 py-2 text-xs text-emerald-300">
              Browser alerts enabled.
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Loading notifications...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet.
              </div>
            )}

            {notifications.map((notification) => {
              const content = (
                <div
                  className={`border-b border-white/10 px-4 py-3 transition hover:bg-white/10 ${
                    notification.read ? "bg-transparent" : "bg-cyan-400/10"
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <span
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                        notification.read ? "bg-transparent" : "bg-cyan-300"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {notification.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-300">
                        {notification.body}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        {formatTimestamp(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );

              if (notification.action_url) {
                return (
                  <Link
                    key={notification.id}
                    to={notification.action_url}
                    onClick={() => setOpen(false)}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={notification.id}
                  type="button"
                  className="block w-full text-left"
                >
                  {content}
                </button>
              );
            })}
          </div>

          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              className="w-full border-t border-white/10 px-4 py-3 text-sm font-medium text-cyan-300 transition hover:bg-white/10"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
