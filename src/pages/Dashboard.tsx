import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PeerCard from "@/components/PeerCard";
import SessionCard from "@/components/SessionCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [recommendedPeers, setRecommendedPeers] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // ✅ Fetch profile
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("Profile error:", error);
      }

      if (data) {
        console.log("PROFILE NAME:", data.name);
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
        .from("sessions")
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

  // ✅ LOADING FIX (VERY IMPORTANT)
 if (!user) {
  return <div className="text-white p-6">Loading...</div>;
}

  // ✅ SAFE NAME FIX
  const displayName =
    profile?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "Learner";

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-emerald-200">
            Welcome back,
            <span className="text-green-400 ml-2">
              {displayName.split(" ")[0]}
            </span>{" "}
            👋
          </h1>

         <p className="text-sm text-emerald-300/70 mt-2">
            Ready to learn something new today?
          </p>
        </motion.div>

        {/* Sessions */}
        <section className="mb-8">
         <h2 className="text-xl font-bold mb-3 text-emerald-200">Upcoming Sessions</h2>

          {upcomingSessions.length > 0 ? (
            upcomingSessions.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))
          ) : (
            <p>No sessions yet</p>
          )}
        </section>

        {/* Recommended */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-emerald-200">
            Recommended Peers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedPeers.map((p, i) => (
              <PeerCard key={p.id} peer={p} index={i} />
            ))}
          </div>
        </section>

        {/* Leaderboard */}
        <section>
          <h2 className="text-xl font-bold mb-3">Leaderboard</h2>

          {leaderboard.map((u, i) => (
            <div
              key={u.id}
              className={`flex items-center justify-between p-3 mb-2 rounded-lg border ${
                i === 0
                  ? "bg-yellow-500/10 border-yellow-400/30"
                  : i === 1
                  ? "bg-gray-400/10 border-gray-300/20"
                  : i === 2
                  ? "bg-orange-500/10 border-orange-400/20"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-black/60 w-5">
                  #{i + 1}
                </span>

                <img
                  src={u.avatar_url || "https://via.placeholder.com/40"}
                  className="w-9 h-9 rounded-full"
                />

                <p className="font-medium">{u.name}</p>
              </div>

              <span className="text-sm text-white/70">
                {u.points || 0} pts
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;