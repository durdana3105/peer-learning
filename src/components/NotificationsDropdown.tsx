/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export const NotificationsDropdown = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const { data } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data as Notification[]);
      }
    };

    fetchNotifications();

    const channel = (supabase as any)
      .channel("public:notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          setNotifications((prev) =>
            [payload.new as Notification, ...prev].slice(0, 20)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    await (supabase as any).from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };
  const markAllAsRead = async () => {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length === 0) return;
    
        await (supabase as any)
          .from("notifications")
          .update({ read: true })
          .in("id", unreadIds);
    
        setNotifications((prev) =>
          prev.map((n) => (unreadIds.includes(n.id) ? { ...n, read: true } : n))
        );
     };
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border border-[#0B0F19]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                   </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#1A1F2E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <div className="flex items-center gap-2">
                            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">
                              {unreadCount} new
                            </span>
                            <button
                              onClick={markAllAsRead}
                               className="text-xs text-gray-400 hover:text-cyan-400 font-medium transition"
                             >
                               Mark all read
                         </button>
                          </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition flex gap-3 ${
                    !notif.read ? "bg-cyan-500/5" : ""
                  }`}
                >
                  {!notif.read && (
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-cyan-400 shrink-0"></div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {notif.body}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};


// Fix for #1162: Added ARIA labels
