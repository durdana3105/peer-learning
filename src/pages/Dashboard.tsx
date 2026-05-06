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

   const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);

  return () => clearInterval(interval);
}, []);
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

  if (!user && !loading) {
  return null;
}
const activities = [
  `Joined ${upcomingSessions.length} Sessions`,
  `Connected with ${recommendedPeers.length} Peers`,
  `Earned ${profile?.points || 0} XP`,
  `Completed ${profile?.sessions_completed || 0} Sessions`,
];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-emerald-900 to-black text-emerald-100 relative overflow-hidden">

      {/* Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,197,94,0.15),transparent)]" />

      <div className="container mx-auto px-4 py-8 relative z-10">

        {/* HEADER */}
       {/* HERO */}
<motion.section
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8"
>
  <div className="absolute top-0 right-0 w-72 h-72 bg-green-500/10 blur-3xl rounded-full" />

  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 relative z-10">

    <div>
      <h1 className="text-4xl font-bold leading-tight">
        Welcome back,
        <span className="text-green-400 ml-2">
          {displayName.split(" ")[0]}
        </span>
        👋
      </h1>

      <p className="text-sm text-emerald-300/50 mt-2">
  {currentTime.toLocaleTimeString()}
</p>

      <p className="text-emerald-300/70 mt-3 text-lg">
        Continue your learning journey today.
      </p>

      <div className="flex gap-4 mt-6 flex-wrap">
        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          🔥 {profile?.sessions_completed || 0} Day Streak
        </div>

        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          ⚡ {profile?.points || 0} XP
        </div>

        <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          🎯 {upcomingSessions.length || 0} Sessions
        </div>
      </div>
    </div>

    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 text-black font-semibold shadow-[0_0_30px_rgba(34,197,94,0.35)]"
    >
      + Start Learning
    </motion.button>
  </div>
</motion.section>

        {/* STATS */}
        {/* QUICK STATS */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">

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
        leaderboard.findIndex((u) => u.id === user?.id) + 1 || 0
      ),
    icon: "🏆",
  },
  {
    label: "Current Streak",
    value: `${profile?.sessions_completed || 0} Days`,
    icon: "🔥",
  },
].map((stat, i) => (
    <motion.div
      key={i}
      whileHover={{
        y: -5,
        scale: 1.02,
      }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-green-400/10 to-transparent" />

      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm text-emerald-300/70">
            {stat.label}
          </p>

          <h3 className="text-3xl font-bold mt-2 text-white">
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

        {/* MAIN */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-8">

          {/* LEFT */}
          <div className="xl:col-span-8 space-y-6">
            {/* Sessions */}
            <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5">
              <h2 className="text-lg mb-4">📅 Upcoming Sessions</h2>

              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))
              ) : (
                <p className="text-emerald-300/60 text-center py-6">
                  No upcoming sessions available right now.
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
        <div className="xl:col-span-4 space-y-6">

  {/* Activity Feed */}
  <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6">
    <h2 className="text-xl font-semibold mb-5">
      ⚡ Activity Feed
    </h2>

    <div className="space-y-4">

      {[
        "Joined AI Session",
        "Completed React Quiz",
        "New Peer Request",
        "Earned 50 XP",
      ].map((activity, i) => (
        <motion.div
          key={i}
          whileHover={{ x: 4 }}
          className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 p-4"
        >
          <div>
            <p className="text-sm">{activity}</p>
            <span className="text-xs text-emerald-300/50">
              2 mins ago
            </span>
          </div>

          <div className="text-green-400">
            ✔
          </div>
        </motion.div>
      ))}
    </div>
  </section>

  {/* Leaderboard */}
  <section className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6">
    <h2 className="text-xl font-semibold mb-5">
      🏆 Leaderboard
    </h2>

    <div className="space-y-3">
      {leaderboard.map((u, i) => (
        <motion.div
          whileHover={{ scale: 1.02 }}
          key={u.id}
          className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/5 p-4"
        >
          <div>
            <p className="font-medium">
              #{i + 1} {u.name}
            </p>

            <span className="text-xs text-emerald-300/60">
              Top Learner
            </span>
          </div>

          <div className="text-green-400 font-bold">
            {u.points || 0}
          </div>
        </motion.div>
      ))}
    </div>
  </section>

</div>

<div className="absolute top-20 left-20 w-72 h-72 bg-green-500/10 blur-3xl rounded-full" />

<div className="absolute bottom-20 right-20 w-72 h-72 bg-emerald-400/10 blur-3xl rounded-full" />

        </div>
      </div>
    </div>
  );
};

export default Dashboard;