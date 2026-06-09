import { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import RecommendationPanel from "@/components/recommendations/RecommendationPanel";
import SessionCard from "@/components/SessionCard";
import StreakStats from "@/components/StreakStats";
import { useAuth } from "@/contexts/useAuth";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { API_BASE_URL } from "@/config/api";
const AnalyticsCharts = lazy(() => import("@/components/AnalyticsCharts"));

interface Profile {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  skills: string[] | null;
  interests: string[] | null;
  teach_subjects: string[] | null;
  learn_subjects: string[] | null;
  rating: number | null;
  sessions_completed: number | null;
  points: number | null;
  badges: string[] | null;
  learning_style: string | null;
  availability: string | null;
  preferred_language: string | null;
  timezone: string | null;
  focus_time_this_week: number | null;
}

interface Session {
  id: string;
  status: string;
  title?: string;
  date?: string;
  created_at?: string;
  created_by?: string;
  topic?: string;
  is_private?: boolean;
}

interface PeerRecommendation {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  skills: string[];
  interests: string[];
  teachSubjects: string[];
  learnSubjects: string[];
  rating: number;
  sessionsCompleted: number;
  points: number;
  badges: string[];
  matchScore: number;
}

const Clock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <p className="mt-3 text-sm text-slate-400">
      {currentTime.toLocaleTimeString()}
    </p>
  );
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { currentMode } = useRole();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendedPeers, setRecommendedPeers] = useState<any[]>([]);
  const [connectedPeerIds, setConnectedPeerIds] = useState<Set<string>>(new Set());
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<{ label: string; timestamp: string }[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const displayName =
    profile?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "Learner";

  // Fetch Profile
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single<Profile>();

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setProfile(data);
        fetchRecommendedPeers(data);
      }
    };

    fetchProfile();
  }, [user]);

  // Activity Feed — derive from sessions joined, resources uploaded, and study rooms joined
  useEffect(() => {
    if (!user) return;

    const fetchActivity = async () => {
      setActivityLoading(true);
      try {
        const [sessionsRes, resourcesRes, roomsRes] = await Promise.all([
          supabase
            .from("sessions")
            .select("title, created_at")
            .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("resources")
            .select("title, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("study_room_participants")
            .select("joined_at, study_rooms(topic)")
            .eq("profile_id", user.id)
            .order("joined_at", { ascending: false })
            .limit(3),
        ]);

        if (sessionsRes.error) throw sessionsRes.error;
        if (resourcesRes.error) throw resourcesRes.error;
        if (roomsRes.error) throw roomsRes.error;

        const entries: { label: string; timestamp: string }[] = [];

        (sessionsRes.data ?? []).forEach((s: any) => {
          entries.push({ label: `Joined session: ${s.title ?? "Untitled"}`, timestamp: s.created_at });
        });
        (resourcesRes.data ?? []).forEach((r: any) => {
          entries.push({ label: `Uploaded resource: ${r.title}`, timestamp: r.created_at });
        });
        (roomsRes.data ?? []).forEach((p: any) => {
          const topic = p.study_rooms?.topic ?? "Study Room";
          entries.push({ label: `Joined study room: ${topic}`, timestamp: p.joined_at });
        });

        entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivityFeed(entries.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch activity feed:", err);
        setActivityFeed([]);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivity();
  }, [user]);

  // Recommended Peers
  const fetchRecommendedPeers = async (myProfile: Profile) => {
    if (!user?.id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${API_BASE_URL}/api/match/supabase-discover?limit=3`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        credentials:"include"
      });
      
      const data = await res.json();
      
      if (data.success && data.recommendations) {
        const mapped: PeerRecommendation[] = data.recommendations.map((p: any) => ({
          id: p.id,
          name: p.name || "User",
          avatar: p.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.name}`,
          bio: p.bio || "",
          skills: p.skills ?? [],
          interests: p.interests ?? [],
          teachSubjects: p.teach_subjects ?? [],
          learnSubjects: p.learn_subjects ?? [],
          rating: p.rating ?? 0,
          sessionsCompleted: p.sessions_completed ?? 0,
          points: p.points ?? 0,
          badges: p.badges ?? [],
          matchScore: p.score ?? 0,
        }));
        
        setRecommendedPeers(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch recommended peers:", err);
    }
  }; };

  const handleConnect = async (peerId: string) => {
    if (!user || connectedPeerIds.has(peerId)) return;
    // Optimistic update prevents duplicate inserts from double-clicks
    setConnectedPeerIds((prev) => new Set([...prev, peerId]));
    const { error } = await (supabase as any).from("peer_connections").insert({
      sender_id: user.id,
      receiver_id: peerId,
      status: "pending",
    });
    if (error) {
      // Roll back optimistic update on failure
      setConnectedPeerIds((prev) => {
        const next = new Set(prev);
        next.delete(peerId);
        return next;
      });
      return;
    }
    const { error: notifError } = await (supabase as any).from("notifications").insert({
      user_id: peerId,
      type: "connection_request",
      body: `${profile?.name || "Someone"} wants to connect with you!`,
    });
    if (notifError) {
      console.error("Failed to send connection notification:", notifError);
    }
  };

  // Sessions
  useEffect(() => {
    const fetchSessions = async () => {
      // SECURITY/PERF: Limit fetch to top 4 to prevent downloading 10,000 global sessions
      // which would cause massive browser OOM crashes and render thrashing.
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("status", "upcoming")
        .limit(4);

      if (error || !data) {
        setUpcomingSessions([]);
        return;
      }

      setUpcomingSessions(data);
    };

    fetchSessions();
  }, []);

  const [globalRank, setGlobalRank] = useState<number>(0);

  // Leaderboard
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      // 1. Fetch top 5 for the mini-leaderboard
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("points", { ascending: false })
        .limit(5);

      if (data) setLeaderboard(data);

      // 2. Fetch true exact rank via RPC to avoid memory leaks
      if (user?.id) {
        const { data: rankData } = await supabase.rpc("get_user_rank", {
          p_user_id: user.id,
        });
        setGlobalRank(rankData || 0);
      }
    };

    fetchLeaderboardData();
  }, [user]);

  // Loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (!user && !loading) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#020617] via-[#020B1F] to-[#050014] text-white">
      {currentMode === 'mentor' && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 border border-emerald-400/20 px-4 py-2 text-sm text-emerald-300">
          You are viewing in <span className="font-semibold">Mentor Mode</span>
        </div>
      )}
      {currentMode === 'learner' && (
        <div className="mb-4 rounded-lg bg-blue-500/10 border border-blue-400/20 px-4 py-2 text-sm text-blue-300">
          You are viewing in <span className="font-semibold">Learner Mode</span>
        </div>
      )}
      <div className="mb-6 flex gap-3">
        {currentMode === 'mentor' && (
          <button
            type="button"
            onClick={() => navigate('/mentor-dashboard')}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Go to Mentor Dashboard
          </button>
        )}
        {currentMode === 'learner' && (
          <button
            type="button"
            onClick={() => navigate('/learner-dashboard')}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400"
          >
            Go to Learner Dashboard
          </button>
        )}
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.12),transparent)]" />

      <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-3xl" />

      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4 py-8">

        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-8 backdrop-blur-2xl"
        >
          <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h1 className="text-4xl font-black leading-tight md:text-5xl">
                Welcome back,
                <span className="ml-3 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  {displayName.split(" ")[0]}
                </span>
                👋
              </h1>

              <Clock />

              <p className="mt-4 text-lg text-slate-300/80">
                Continue your learning journey today.
              </p>

              <div className="mt-6 flex flex-wrap gap-4">

                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
                  🔥 {profile?.sessions_completed || 0} Day Streak
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
                  ⚡ {profile?.points || 0} XP
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
                  🎯 {upcomingSessions.length || 0} Sessions
                </div>
                
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
                  ⏱️ {profile?.focus_time_this_week ? Math.round(profile.focus_time_this_week / 60) : 0} hrs focused
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/sessions")}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-4 font-semibold text-black shadow-[0_0_35px_rgba(34,211,238,0.35)]"
            >
              + Start Learning
            </motion.button>
          </div>
        </motion.section>

        {/* STATS */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-4">
          <div className="md:col-span-1 xl:col-span-1">
            <StreakStats />
          </div>

          <div className="md:col-span-2 xl:col-span-3 space-y-6">
            {[
              {
                label: "Sessions Joined",
                value: upcomingSessions.length || 0,
                icon: "📚",
              },
              {
                label: "Study Hours",
                value: `${(profile?.sessions_completed || 0) * 2}h`,
                icon: "⏰",
              },
              {
                label: "Global Rank",
                value:
                  "#" +
                  (
                    globalRank || 0
                  ),
                icon: "🏆",
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{
                  y: -5,
                  scale: 1.02,
                }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-purple-500/10 opacity-0 transition group-hover:opacity-100" />

                <div className="relative z-10 flex items-center justify-between">

                  <div>
                    <p className="text-sm text-slate-400">
                      {stat.label}
                    </p>

                    <h3 className="mt-2 text-3xl font-black text-white">
                      {stat.value}
                    </h3>
                  </div>

                  <div className="text-4xl">
                    {stat.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        {/* Analytics */}
        <Suspense
          fallback={<div className="mt-10 h-72 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl animate-pulse" />}
        >
          <AnalyticsCharts profile={profile} sessions={upcomingSessions} />
        </Suspense>

        <RecommendationPanel profile={profile} sessions={upcomingSessions} />


        {/* MAIN */}
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-12">

          {/* LEFT */}
          <div className="space-y-6 xl:col-span-8">

            {/* Sessions */}
            <section className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-2xl">
              <h2 className="mb-5 text-xl font-semibold">
                📅 Upcoming Sessions
              </h2>

              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))
              ) : (
                <p className="py-8 text-center text-slate-400">
                  No upcoming sessions available right now.
                </p>
              )}
            </section>

            {/* Peers */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <h2 className="mb-5 text-xl font-semibold">
                👥 Recommended Peers
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {recommendedPeers.map((p, i) => (
                  <div
                      key={p.id}
                      className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/70 to-slate-800/40 p-5 backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">
                          {p.name}
                        </h3>

                        <div className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm font-semibold text-cyan-300">
                         {p.matchScore}% •{" "}
                          {p.matchScore >= 90
                            ? "Perfect Match"
                            : p.matchScore >= 70
                            ? "Strong Match"
                            : p.matchScore >= 50
                            ? "Good Match"
                            : "Compatible"}
                        </div>
                      </div>

                      <p className="mt-2 text-sm text-slate-400">
                        🤖 Smart AI matching based on skills, learning goals,
                        interests, timezone compatibility, and learning style.
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {p.skills?.slice(0, 4).map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => handleConnect(p.id)}
                        disabled={connectedPeerIds.has(p.id)}
                        className="mt-5 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 font-semibold text-slate-900 transition hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {connectedPeerIds.has(p.id) ? "Pending" : "Connect with Peer"}
                      </button>
                    </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="space-y-6 xl:col-span-4">

            {/* Activity Feed */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <h2 className="mb-5 text-xl font-semibold">
                ⚡ Activity Feed
              </h2>

              <div className="space-y-4">
                {activityLoading && (
                  <p className="text-sm text-slate-400">Loading activity…</p>
                )}
                {!activityLoading && activityFeed.length === 0 && (
                  <p className="text-sm text-slate-400">No recent activity yet.</p>
                )}
                {!activityLoading && activityFeed.map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4"
                  >
                    <div>
                      <p className="text-sm text-white">
                        {item.label}
                      </p>
                      <span className="text-xs text-slate-400">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-cyan-400">✔</div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Leaderboard */}
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
              <h2 className="mb-5 text-xl font-semibold">
                🏆 Leaderboard
              </h2>

              <div className="space-y-3">

                {leaderboard.map((u, i) => (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    key={u.id}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4"
                  >
                    <div>
                      <p className="font-medium text-white">
                        #{i + 1} {u.name}
                      </p>

                      <span className="text-xs text-slate-400">
                        Top Learner
                      </span>
                    </div>

                    <div className="font-bold text-cyan-400">
                      {u.points || 0}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

