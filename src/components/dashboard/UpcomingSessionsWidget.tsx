import { useEffect, useState } from "react";
import { Calendar, Clock, Video } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

export default function UpcomingSessionsWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchSessions() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select("id, title, status, scheduled_at, duration_minutes, mentor_id")
          .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
          .in("status", ["scheduled", "live"])
          .order("scheduled_at", { ascending: true })
          .limit(3);

        if (error) throw error;
        if (mounted) setUpcomingSessions(data || []);
      } catch (err) {
        console.error("Failed to fetch upcoming sessions:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchSessions();
    return () => { mounted = false; };
  }, [user]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar size={20} className="text-purple-400" />
          Upcoming Sessions
        </h3>
        <Link to="/sessions" className="text-sm text-cyan-400 hover:text-cyan-300">
          View all
        </Link>
      </div>

      <div className="space-y-4 flex-1">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-slate-800/40 rounded-2xl"></div>
            <div className="h-24 bg-slate-800/40 rounded-2xl"></div>
          </div>
        ) : upcomingSessions.length > 0 ? (
          upcomingSessions.map((session) => {
            const dateObj = new Date(session.scheduled_at || Date.now());
            const dateStr = dateObj.toLocaleDateString();
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <div
                key={session.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4 hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {session.title || "Untitled Session"}
                  </h4>
                  {session.status === "live" ? (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} /> {timeStr}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Duration: {session.duration_minutes || 60} mins
                </p>
                
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-700/50">
                  <span className="text-xs font-medium text-slate-300 bg-slate-700/50 px-2.5 py-1 rounded-md">
                    {dateStr}
                  </span>
                  <button 
                    onClick={() => navigate('/sessions')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Video size={14} /> Join
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-8">
            <Calendar size={32} className="mb-2 opacity-50" />
            <p className="text-sm">No upcoming sessions</p>
          </div>
        )}
      </div>
    </div>
  );
}
