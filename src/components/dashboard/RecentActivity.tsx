import { useEffect, useState } from "react";
import { Activity, BookOpen, CheckCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

interface ActivityItem {
  id: string;
  title: string;
  time: string;
  timestamp: string;
  icon: JSX.Element;
  color: string;
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}

export default function RecentActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchActivities() {
      if (!user) return;
      setLoading(true);
      try {
        const [sessionsRes, resourcesRes, roomsRes] = await Promise.all([
          supabase
            .from("sessions")
            .select("id, title, created_at")
            .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("resources")
            .select("id, title, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("study_room_participants")
            .select("room_id, joined_at, study_rooms(topic)")
            .eq("profile_id", user.id)
            .order("joined_at", { ascending: false })
            .limit(3),
        ]);

        if (!mounted) return;

        if (sessionsRes.error) console.error("Sessions error:", sessionsRes.error);
        if (resourcesRes.error) console.error("Resources error:", resourcesRes.error);
        if (roomsRes.error) console.error("Rooms error:", roomsRes.error);

        const entries: ActivityItem[] = [];

        (sessionsRes.data ?? []).forEach((s: any) => {
          entries.push({
            id: `session-${s.id}`,
            title: `Joined session: ${s.title ?? "Untitled"}`,
            time: timeAgo(s.created_at),
            timestamp: s.created_at,
            icon: <CheckCircle size={16} className="text-emerald-400" />,
            color: "bg-emerald-400/10 border-emerald-400/20",
          });
        });
        (resourcesRes.data ?? []).forEach((r: any) => {
          entries.push({
            id: `resource-${r.id}`,
            title: `Uploaded resource: ${r.title}`,
            time: timeAgo(r.created_at),
            timestamp: r.created_at,
            icon: <BookOpen size={16} className="text-blue-400" />,
            color: "bg-blue-400/10 border-blue-400/20",
          });
        });
        (roomsRes.data ?? []).forEach((p: any) => {
          const topic = p.study_rooms?.topic ?? "Study Room";
          entries.push({
            id: `room-${p.room_id}`,
            title: `Joined study room: ${topic}`,
            time: timeAgo(p.joined_at),
            timestamp: p.joined_at,
            icon: <Users size={16} className="text-purple-400" />,
            color: "bg-purple-400/10 border-purple-400/20",
          });
        });

        entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(entries.slice(0, 4));
      } catch (err) {
        console.error("Failed to load activity feed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchActivities();
    return () => { mounted = false; };
  }, [user]);
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity size={20} className="text-emerald-400" />
          Recent Activity
        </h3>
      </div>

      <div className="space-y-4 flex-1 relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-800" />

        {activities.map((activity) => (
          <div key={activity.id} className="relative pl-12 group cursor-pointer">
            {/* Icon circle on timeline */}
            <div
              className={`absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center border z-10 ${activity.color}`}
            >
              {activity.icon}
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 hover:bg-slate-800/60 transition-colors">
              <p className="text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                {activity.title}
              </p>
              <span className="text-xs text-slate-500 mt-1 block">
                {activity.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}