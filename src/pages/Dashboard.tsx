import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Trophy, TrendingUp, BookOpen, Star, Settings } from "lucide-react";
import PeerCard from "@/components/PeerCard";
import SessionCard from "@/components/SessionCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

  // ✅ Fetch profile + peers
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

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

useEffect(() => {
  const fetchSessions = async () => {
    const { data, error } = await (supabase as any)
  .from("sessions")
  .select("*")
  .eq("status", "upcoming");// make sure column exists

    if (error) {
      console.log("Error fetching sessions:", error);
    } else {
      setUpcomingSessions(data || []);
    }
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

  const displayName =
    profile?.name || user?.user_metadata?.name || "Learner";

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 flex justify-between"
        >
          <h1 className="text-3xl font-bold">
            Welcome back, {displayName.split(" ")[0]} 👋
          </h1>
        </motion.div>

        {/* Sessions */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Upcoming Sessions</h2>

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
          <h2 className="text-xl font-bold mb-3">Recommended Peers</h2>

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
            <div key={u.id} className="flex gap-3 items-center">
              <span>{i + 1}</span>
              <img
                src={u.avatar_url || "https://via.placeholder.com/40"}
                className="w-8 h-8 rounded"
              />
              <p>{u.name}</p>
              <span>{u.points || 0}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;