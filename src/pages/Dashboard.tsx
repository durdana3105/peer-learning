import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Trophy, TrendingUp, BookOpen, Star, Settings } from "lucide-react";
import PeerCard from "@/components/PeerCard";
import SessionCard from "@/components/SessionCard";
import { sessions, leaderboard } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { User } from "@/data/mockData";

interface Profile {
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
  const [recommendedPeers, setRecommendedPeers] = useState<User[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch own profile
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          fetchRecommendedPeers(data);
        }
      });
  }, [user]);

  const fetchRecommendedPeers = async (myProfile: Profile) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user!.id)
      .limit(6);

    if (data && data.length > 0) {
      const myLearn = myProfile.learn_subjects || [];
      const myTeach = myProfile.teach_subjects || [];
      const myInterests = myProfile.interests || [];

      const mapped: User[] = data.map((p) => {
        const pTeach = p.teach_subjects || [];
        const pLearn = p.learn_subjects || [];
        const pInterests = p.interests || [];

        // Match score: how well this peer complements me
        const teachOverlap = myLearn.filter((s) => pTeach.includes(s)).length;
        const learnOverlap = myTeach.filter((s) => pLearn.includes(s)).length;
        const interestOverlap = myInterests.filter((s) => pInterests.includes(s)).length;
        const maxPossible = Math.max(myLearn.length + myTeach.length + myInterests.length, 1);
        const matchScore = Math.min(Math.round(((teachOverlap + learnOverlap + interestOverlap) / maxPossible) * 100), 100);

        return {
          id: p.id,
          name: p.name || "Anonymous",
          avatar: p.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.name}`,
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

      // Sort by match score
      mapped.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      setRecommendedPeers(mapped.slice(0, 3));
    }
  };

  const displayName = profile?.name || user?.user_metadata?.name || "Learner";
  const upcomingSessions = sessions.filter((s) => s.status === "upcoming");

  const userPoints = profile?.points ?? 0;
  const userRating = profile?.rating ?? 0;
  const userSessions = profile?.sessions_completed ?? 0;
  const userBadges = profile?.badges ?? [];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-extrabold">
              Welcome back, {displayName.split(" ")[0]}! 👋
            </h1>
            <p className="mt-1 text-muted-foreground">Here's what's happening with your learning journey.</p>
          </div>
          <Link to="/profile">
            <Button variant="outline" size="sm">
              <Settings className="mr-1 h-4 w-4" /> Edit Profile
            </Button>
          </Link>
        </motion.div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: BookOpen, label: "Sessions", value: userSessions, color: "text-primary" },
            { icon: Star, label: "Rating", value: userRating, color: "text-warning" },
            { icon: Trophy, label: "Points", value: userPoints, color: "text-accent" },
            { icon: TrendingUp, label: "Badges", value: userBadges.length, color: "text-primary" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="mt-2 font-heading text-2xl font-extrabold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> Upcoming Sessions
                </h2>
                <Link to="/sessions">
                  <Button variant="ghost" size="sm" className="text-primary">View all →</Button>
                </Link>
              </div>
              <div className="space-y-3">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((s) => <SessionCard key={s.id} session={s} />)
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                    <Calendar className="mx-auto h-8 w-8 opacity-30" />
                    <p className="mt-2 text-sm">No upcoming sessions.</p>
                    <Link to="/sessions">
                      <Button variant="outline" size="sm" className="mt-3">Schedule one</Button>
                    </Link>
                  </div>
                )}
              </div>
            </section>
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Recommended for You
                </h2>
                <Link to="/discover">
                  <Button variant="ghost" size="sm" className="text-primary">Discover more →</Button>
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {recommendedPeers.length > 0
                  ? recommendedPeers.map((p, i) => <PeerCard key={p.id} peer={p} index={i} />)
                  : <p className="text-sm text-muted-foreground col-span-2">Complete your profile to get recommendations!</p>
                }
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-hero text-2xl font-bold text-primary-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-heading font-bold">{displayName}</h3>
                  <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Level Progress</span>
                  <span className="font-medium">{userPoints} pts</span>
                </div>
                <Progress value={(userPoints / 2000) * 100} className="mt-2 h-2" />
              </div>
              {userBadges.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {userBadges.map((b) => <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>)}
                </div>
              )}
              <Link to="/profile" className="mt-4 block">
                <Button variant="outline" size="sm" className="w-full">Edit Profile</Button>
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" /> Leaderboard
                </h3>
                <Link to="/leaderboard">
                  <Button variant="ghost" size="sm" className="text-xs text-primary">View all</Button>
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {leaderboard.map((entry) => (
                  <div key={entry.rank} className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      entry.rank <= 3 ? "bg-gradient-warm text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>{entry.rank}</span>
                    <img src={entry.avatar} alt={entry.name} className="h-8 w-8 rounded-lg bg-muted" />
                    <p className="flex-1 text-sm font-medium">{entry.name}</p>
                    <span className="text-sm font-bold text-primary">{entry.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
