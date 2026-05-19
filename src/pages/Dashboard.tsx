import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PeerCard from "@/components/PeerCard";
import SessionCard from "@/components/SessionCard";
import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AnalyticsCharts from "@/components/AnalyticsCharts";

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
interface Session {
  id: string;
  status: string;
  title?: string;
  date?: string;
}


const Dashboard = () => {
  const { user, loading } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recommendedPeers, setRecommendedPeers] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
        .single<Profile>();   // 👈 tell TS this is a single Profile row

      if (error) {
        console.error(error);
        return;
      }

      if (data) {
        setProfile(data);              // TS now knows `data` is Profile
        fetchRecommendedPeers(data);   // safe to pass
      }
    };



    fetchProfile();
  }, [user]);

  // Recommended Peers
  const fetchRecommendedPeers = async (myProfile: Profile) => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .returns<Profile[]>();

    if (error || !data) return;

    const peers = data || [];

    const myLearn = myProfile.learn_subjects ?? [];
    const myTeach = myProfile.teach_subjects ?? [];
    const myInterests = myProfile.interests ?? [];

    const mapped = peers.map((p) => {

      const teach = p.teach_subjects ?? [];
      const learn = p.learn_subjects ?? [];
      const interests = p.interests ?? [];

      const teachOverlap = myLearn.filter((s) => teach.includes(s)).length;
      const learnOverlap = myTeach.filter((s) => learn.includes(s)).length;
      const interestOverlap = myInterests.filter((s) => interests.includes(s)).length;

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
        skills: p.skills ?? [],
        interests: interests,
        teachSubjects: teach,
        learnSubjects: learn,
        rating: p.rating ?? 0,
        sessionsCompleted: p.sessions_completed ?? 0,
        points: p.points ?? 0,
        badges: p.badges ?? [],
        matchScore,
      };
    });

    mapped.sort((a, b) => b.matchScore - a.matchScore);
    setRecommendedPeers(mapped.slice(0, 3));
  };

  // Sessions
  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("status", "upcoming");

      if (error || !data) {
        setUpcomingSessions([]);
        return;
      }

      setUpcomingSessions(data);
    };

    fetchSessions();
  }, []);


  // Leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("points", { ascending: false });

      if (data) setLeaderboard(data);
    };

    fetchLeaderboard();
  }, []);

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

              <p className="mt-3 text-sm text-slate-400">
                {currentTime.toLocaleTimeString()}
              </p>

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
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-4 font-semibold text-black shadow-[0_0_35px_rgba(34,211,238,0.35)]"
            >
              + Start Learning
            </motion.button>
          </div>
        </motion.section>

        {/* STATS */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

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
        {/* Analytics */}
        <AnalyticsCharts profile={profile} sessions={upcomingSessions} />


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
                  <PeerCard key={p.id} peer={p} index={i} />
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

                {[
                  "Joined AI Session",
                  "Completed React Quiz",
                  "New Peer Request",
                  "Earned 50 XP",
                ].map((activity, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4"
                  >
                    <div>
                      <p className="text-sm text-white">
                        {activity}
                      </p>

                      <span className="text-xs text-slate-400">
                        2 mins ago
                      </span>
                    </div>

                    <div className="text-cyan-400">
                      ✔
                    </div>
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