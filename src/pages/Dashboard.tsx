import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PeerCard from "@/components/PeerCard";
import SessionCard from "@/components/SessionCard";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

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
}

const Dashboard = () => {
  const { user, loading } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendedPeers, setRecommendedPeers] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // 🔥 display name fix
  const displayName =
    profile?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "Learner";

  // ✅ Fetch profile
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) console.log(error);

      if (data) {
        setProfile(data);
        fetchRecommendedPeers(data);
      }
    };

    fetchProfile();
  }, [user]);

  // ✅ Fetch recommended peers
  const fetchRecommendedPeers = async (myProfile: Profile) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user!.id)
      .limit(6);

    if (!data) return;

    const myLearn = myProfile.learn_subjects || [];
    const myTeach = myProfile.teach_subjects || [];
    const myInterests = myProfile.interests || [];

    const mapped = data.map((p) => {
      const teachOverlap = myLearn.filter((s) =>
        (p.teach_subjects || []).includes(s)
      ).length;

      const learnOverlap = myTeach.filter((s) =>
        (p.learn_subjects || []).includes(s)
      ).length;

      const interestOverlap = myInterests.filter((s) =>
        (p.interests || []).includes(s)
      ).length;

      const max = Math.max(
        myLearn.length + myTeach.length + myInterests.length,
        1
      );

      const matchScore = Math.round(
        ((teachOverlap + learnOverlap + interestOverlap) / max) * 100
      );

      return {
        id: p.id,
        name: p.name || "User",
        avatar:
          p.avatar_url ||
          `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.name}`,
        bio: p.bio || "",
        skills: p.skills || [],
        interests: p.interests || [],
        teachSubjects: p.teach_subjects || [],
        learnSubjects: p.learn_subjects || [],
        rating: p.rating || 0,
        sessionsCompleted: p.sessions_completed || 0,
        points: p.points || 0,
        badges: p.badges || [],
        matchScore,
      };
    });

    mapped.sort((a, b) => b.matchScore - a.matchScore);
    setRecommendedPeers(mapped.slice(0, 3));
  };

  // ✅ Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await supabase
        .from<any>("sessions")
        .select("*")
        .eq("status", "upcoming");

      setUpcomingSessions(data || []);
    };

    fetchSessions();
  }, []);

  // ✅ Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("points", { ascending: false })
        .limit(5);

      if (data) setLeaderboard(data);
    };

    fetchLeaderboard();
  }, []);

  // 🔥 FIXED LOADING
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-emerald-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-400 border-t-transparent" />
      </div>
    );
  }

  // 🔥 Redirect if not logged in
 if (!user) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-950 text-emerald-200">
      Checking your session...
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-black text-emerald-100 relative overflow-hidden">

      {/* Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,197,94,0.15),transparent)]" />

      <div className="container py-8 space-y-8 relative z-10">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-semibold">
              Welcome back,
              <span className="text-green-400 ml-2">
                {displayName.split(" ")[0]}
              </span> 👋
            </h1>

            <p className="text-sm text-emerald-300/70 mt-1">
              Your learning dashboard is ready
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2 rounded-xl bg-green-500 text-black font-medium shadow-[0_0_20px_rgba(34,197,94,0.4)]"
          >
            + Book Session
          </motion.button>
        </motion.div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Sessions", value: upcomingSessions.length },
            { label: "Peers", value: recommendedPeers.length },
            {
              label: "Points",
              value:
                leaderboard.find((u) => u.id === user.id)?.points || 0,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="p-5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-center"
            >
              <p className="text-sm text-emerald-300/70">{stat.label}</p>
              <h3 className="text-2xl font-semibold text-green-400 mt-2">
                {stat.value}
              </h3>
            </motion.div>
          ))}
        </div>

        {/* MAIN */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            {/* Sessions */}
            <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <h2 className="text-lg mb-4">📅 Upcoming Sessions</h2>

              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))
              ) : (
                <p className="text-emerald-300/60 text-center py-6">
                  No sessions yet
                </p>
              )}
            </section>

            {/* Peers */}
            <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <h2 className="text-lg mb-4">👥 Recommended Peers</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedPeers.map((p, i) => (
                  <PeerCard key={p.id} peer={p} index={i} />
                ))}
              </div>
            </section>

          </div>

          {/* RIGHT */}
          <div>
            <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <h2 className="text-lg mb-4">🏆 Leaderboard</h2>

              {leaderboard.map((u, i) => (
                <div
                  key={u.id}
                  className="flex justify-between p-3 mb-2 rounded-lg bg-white/5"
                >
                  <span>#{i + 1} {u.name}</span>
                  <span>{u.points || 0}</span>
                </div>
              ))}
            </section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;