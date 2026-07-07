/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/useAuth";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SessionCard from "@/components/SessionCard";
import { MentorshipMilestones } from "@/components/mentorship/MentorshipMilestones";
import type { Session } from "@/types";

type MentorSessionRow = {
  id: number;
  title: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  status: string | null;
};

type MentorProfile = {
  name: string | null;
  sessions_completed: number | null;
  points: number | null;
  rating: number | null;
};

const toSessionCardModel = (session: MentorSessionRow): Session => {
  const scheduledAt = session.scheduled_at ? new Date(session.scheduled_at) : null;

  return {
    id: String(session.id),
    peerId: "",
    peerName: "Learner",
    peerAvatar: "/placeholder.svg",
    subject: session.title || "Mentorship session",
    date: scheduledAt ? scheduledAt.toLocaleDateString() : "Not scheduled",
    time: scheduledAt ? scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
    duration: session.duration_minutes ?? 60,
    status: session.status === "ended" || session.status === "completed" ? "completed" : "upcoming",
  };
};

const MentorDashboard = () => {
  const { user, loading } = useAuth();
  const { currentMode } = useRole();
  
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);

  const displayName =
    profile?.name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "Mentor";

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch real Mentor Profile Stats
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name,sessions_completed,points,rating")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }

        // Fetch Upcoming Mentor Sessions
        const { data: sessionData } = await supabase
          .from("sessions")
          .select("id,title,scheduled_at,duration_minutes,status")
          .in("status", ["upcoming", "scheduled", "live"])
          .limit(4);

        if (sessionData) {
          setUpcomingSessions(sessionData.map(toSessionCardModel));
        }
      } catch (err) {
        console.error("Failed to fetch mentor dashboard data", err);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <Link
            to="/"
            className="inline-block rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-500"
          >
            ← Back 
          </Link>

          <p className="text-sm text-emerald-300">
            Current mode: {currentMode}
          </p>
          <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
          <p className="text-slate-400">Welcome back, {displayName}!</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Sessions Hosted</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-400">
              {profile?.sessions_completed || 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total XP</p>
            <p className="mt-2 text-3xl font-semibold text-cyan-400">
              {profile?.points || 0}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Average Rating</p>
            <p className="mt-2 text-3xl font-semibold text-yellow-400">
              {profile?.rating ? `${profile.rating}/5` : "New 🚀"}
            </p>
          </div>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-semibold">Upcoming Mentorship Sessions</h2>
          
          {upcomingSessions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="bg-slate-950 rounded-xl p-2 border border-slate-800">
                  <SessionCard session={session} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-slate-400">
              No upcoming sessions. Once learners book with you, they will appear here.
            </p>
          )}
        </section>

        {user && (
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <MentorshipMilestones userId={user.id} isMentor={true} />
          </section>
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;

