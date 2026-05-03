import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, Star, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url: string | null;
  points: number;
  sessions_completed: number;
  rating: number;
  badges: string[];
}

const rankColors = ["", "bg-gradient-warm text-primary-foreground", "bg-muted text-foreground", "bg-muted text-foreground"];

const Leaderboard = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, name, avatar_url, points, sessions_completed, rating, badges")
      .order("points", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setEntries(data as LeaderboardEntry[]);
        setLoading(false);
      });
  }, []);

  const myRank = entries.findIndex((e) => e.id === user?.id) + 1;
  const myEntry = entries.find((e) => e.id === user?.id);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-extrabold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-warning" /> Leaderboard & Rewards
          </h1>
          <p className="mt-1 text-muted-foreground">Top learners and teachers on PeerLearn.</p>
        </motion.div>

        {/* Your rank card */}
        {myEntry && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-hero text-2xl font-bold text-primary-foreground">
                #{myRank}
              </div>
              <div className="flex-1">
                <p className="font-heading font-bold">Your Rank</p>
                <p className="text-sm text-muted-foreground">{myEntry.points} points · {myEntry.sessions_completed} sessions · ⭐ {myEntry.rating}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {(myEntry.badges || []).map((b) => (
                  <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress to next level</span>
                <span>{myEntry.points} / 2000</span>
              </div>
              <Progress value={(myEntry.points / 2000) * 100} className="mt-1 h-2" />
            </div>
          </motion.div>
        )}

        {/* Top 3 podium */}
        {entries.length >= 3 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[entries[1], entries[0], entries[2]].map((e, i) => {
              const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
              const height = rank === 1 ? "h-32" : rank === 2 ? "h-24" : "h-20";
              return (
                <motion.div key={e.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex flex-col items-center">
                  <div className="relative mb-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-bold">
                      {e.avatar_url ? <img src={e.avatar_url} alt={e.name} className="h-16 w-16 rounded-full" /> : e.name.charAt(0)}
                    </div>
                    {rank === 1 && <Medal className="absolute -top-2 -right-2 h-6 w-6 text-warning" />}
                  </div>
                  <p className="text-sm font-bold text-center truncate max-w-full">{e.name || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">{e.points} pts</p>
                  <div className={`mt-2 w-full rounded-t-lg ${rank === 1 ? "bg-gradient-hero" : "bg-muted"} ${height} flex items-end justify-center pb-2`}>
                    <span className="text-lg font-extrabold text-primary-foreground">#{rank}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full ranking list */}
        <div className="mt-8 space-y-2">
          {entries.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.03 }}
              className={`flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card ${
                e.id === user?.id ? "ring-2 ring-primary/30" : ""
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                i < 3 ? "bg-gradient-warm text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i + 1}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                {e.avatar_url ? <img src={e.avatar_url} alt={e.name} className="h-10 w-10 rounded-lg" /> : e.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm font-bold truncate">{e.name || "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">{e.sessions_completed} sessions · ⭐ {e.rating}</p>
              </div>
              <div className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-warning" />
                <span className="font-heading font-bold text-primary">{e.points}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {entries.length === 0 && (
          <div className="mt-16 text-center text-muted-foreground">
            <Trophy className="mx-auto h-12 w-12 opacity-30" />
            <p className="mt-3">No users on the leaderboard yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
