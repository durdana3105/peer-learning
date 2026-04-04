import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Calendar, MessageCircle, UserPlus, Star, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "session_invite" | "message" | "review" | "system" | "connection";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  { id: "n1", type: "session_invite", title: "Session Invite", description: "Sarah Kim invited you to a UI/UX Design session on Apr 10 at 3 PM.", timestamp: "5 min ago", read: false },
  { id: "n2", type: "message", title: "New Message", description: "Marcus Johnson sent you a message about ML resources.", timestamp: "1 hour ago", read: false },
  { id: "n3", type: "review", title: "New Review", description: "Jamal Williams gave you a 5-star rating for your React session!", timestamp: "3 hours ago", read: false },
  { id: "n4", type: "connection", title: "New Connection", description: "Priya Patel wants to connect with you for math tutoring.", timestamp: "Yesterday", read: true },
  { id: "n5", type: "system", title: "Badge Earned!", description: "Congrats! You've earned the 🔥 Streak Master badge.", timestamp: "2 days ago", read: true },
  { id: "n6", type: "session_invite", title: "Session Reminder", description: "Your session with Wei Zhang on Physics is tomorrow at 10 AM.", timestamp: "2 days ago", read: true },
];

const iconMap = {
  session_invite: Calendar,
  message: MessageCircle,
  review: Star,
  system: Bell,
  connection: UserPlus,
};

const colorMap = {
  session_invite: "text-primary",
  message: "text-accent",
  review: "text-warning",
  system: "text-info",
  connection: "text-secondary",
};

const Notifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllRead = () => setNotifications(notifications.map((n) => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifications(notifications.filter((n) => n.id !== id));
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-extrabold flex items-center gap-2">
              <Bell className="h-8 w-8 text-primary" /> Notifications
            </h1>
            <p className="mt-1 text-muted-foreground">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.` : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <Check className="mr-1 h-4 w-4" /> Mark all read
            </Button>
          )}
        </motion.div>

        <div className="mt-6 space-y-3">
          {notifications.map((n, i) => {
            const Icon = iconMap[n.type];
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-4 rounded-xl border p-4 shadow-card transition-colors ${
                  n.read ? "border-border bg-card" : "border-primary/20 bg-primary/5"
                }`}
              >
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${colorMap[n.type]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-heading text-sm font-bold">{n.title}</p>
                    {!n.read && <Badge className="h-5 text-[10px]">New</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{n.timestamp}</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => dismiss(n.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </motion.div>
            );
          })}
          {notifications.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-3">No notifications yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
