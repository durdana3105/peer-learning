/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Flame,
  Star,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import { useVirtualizer } from "@tanstack/react-virtual";

import {
  calculateLevel,
  calculateProgress,
  getBadgeByXP,
} from "@/lib/gamification";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  streak: number;
  sessions_joined: number;
  badges: string[];
  updated_at?: string;
}

type LeaderboardRowProps = {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser: boolean;
};

const LeaderboardRow = memo(({ entry, index, isCurrentUser }: LeaderboardRowProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      className={`rounded-3xl border p-5 backdrop-blur-xl transition-all duration-300 ${
        isCurrentUser
          ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
          : "border-white/10 bg-white/5 hover:border-cyan-500/20"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold ${
            index < 3
              ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black"
              : "bg-white/10 text-white"
          }`}
        >
          #{index + 1}
        </div>

        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/10 text-xl font-bold">
          {entry.avatar_url ? (
            <img
              src={entry.avatar_url}
              alt={entry.username}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            entry.username.charAt(0)
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold">{entry.username}</h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <span>🔥 {entry.streak} day streak</span>
            <span>📚 {entry.sessions_joined} sessions</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-cyan-500/10 px-4 py-3">
          <Flame className="h-5 w-5 text-yellow-400" />
          <div>
            <p className="text-xs text-gray-400">XP</p>
            <h2 className="text-xl font-black text-cyan-400">{entry.xp}</h2>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

const Leaderboard = () => {

  const { user } = useAuth();

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All Time");
  const [myRank, setMyRank] = useState<number>(0);
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null);
  const [totalLearners, setTotalLearners] = useState<number>(0);
  const listParentRef = useRef<HTMLDivElement | null>(null);

  // FETCH LEADERBOARD
  const fetchLeaderboard = async () => {

    setLoading(true);

    let query = supabase
      .from("leaderboard" as any)
      .select("*");

    if (filter === "Weekly") {

      const lastWeek = new Date();

      lastWeek.setDate(lastWeek.getDate() - 7);

      query = query.gte(
        "updated_at",
        lastWeek.toISOString()
      );
    }

    if (filter === "Monthly") {

      const lastMonth = new Date();

      lastMonth.setMonth(lastMonth.getMonth() - 1);

      query = query.gte(
        "updated_at",
        lastMonth.toISOString()
      );
    }

    const { data, error } = await query
      .order("xp", { ascending: false })
      .limit(50);

    if (!error && data) {

      const updatedData = data.map((entry: any) => ({
        ...entry,
        badges:
          entry.badges && entry.badges.length > 0
            ? entry.badges
            : [getBadgeByXP(entry.xp)],
      }));

      setEntries(updatedData as LeaderboardEntry[]);
    }

    // Fetch total learner count efficiently (head-only count)
    const { count } = await supabase
      .from("leaderboard")
      .select("*", { count: "exact", head: true });

    setTotalLearners(count || 0);

    // Fetch current user's rank separately so it's always accurate
    if (user) {
      // Get the current user's entry
      const { data: myData } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (myData) {
        const enrichedEntry = {
          ...myData,
          badges:
            myData.badges && myData.badges.length > 0
              ? myData.badges
              : [getBadgeByXP(myData.xp)],
        } as LeaderboardEntry;

        setMyEntry(enrichedEntry);

        // Fetch user's exact rank via RPC to avoid pulling data
        const { data: rpcRank } = await supabase.rpc("get_user_rank", {
          p_user_id: user.id,
          p_filter: filter,
        });

        setMyRank(rpcRank || 0);
      } else {
        setMyEntry(null);
        setMyRank(0);
      }
    }

    setLoading(false);
  };

  // AUTO CREATE USER
  const ensureUserExists = async () => {

    if (!user) return;

    const { data: existingUser } = await supabase
      .from("leaderboard" as any)
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!existingUser) {

      await (supabase as any).rpc("join_leaderboard", {
        _username:
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Anonymous",

        _avatar_url:
          user.user_metadata?.avatar_url || null,
      });
    }
  };

  // INIT
  useEffect(() => {

    const init = async () => {

      await ensureUserExists();
      await fetchLeaderboard();
    };

    init();

  }, [user, filter]);

  // REALTIME
  // We use a ref so the realtime listener always calls the latest fetchLeaderboard, 
  // preventing stale closures (where filter = "All Time" and user = null) from overwriting rank.
  const fetchRef = useRef(fetchLeaderboard);
  useEffect(() => {
    fetchRef.current = fetchLeaderboard;
  }, [fetchLeaderboard]);

  useEffect(() => {

    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leaderboard",
        },
        () => {
          fetchRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  // myRank and myEntry are now fetched as state from the server

  const listVirtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 180,
    overscan: 6,
  });

  // LOADING
  if (loading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#050816]">

        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />

      </div>
    );
  }

  return (

    <div className="relative min-h-screen overflow-hidden bg-[#050816] px-4 py-10 text-white">

      {/* BACKGROUND GLOWS */}
      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >

          <div className="inline-flex items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-5 py-2 backdrop-blur-xl">

            <Trophy className="h-5 w-5 text-yellow-400" />

            <span className="text-sm font-medium text-cyan-300">
              Competitive Learning System
            </span>

          </div>

          <h1 className="mt-6 bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-5xl font-black tracking-tight text-transparent">

            Leaderboard

          </h1>

          <p className="mt-4 text-lg text-gray-400">
            Compete. Learn. Grow together.
          </p>

        </motion.div>

        {/* STATS */}
        <div className="mt-12 grid gap-5 md:grid-cols-4">

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">

            <p className="text-sm text-gray-400">
              Total Learners
            </p>

            <h2 className="mt-3 text-4xl font-bold text-cyan-400">
              {totalLearners}
            </h2>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">

            <p className="text-sm text-gray-400">
              Your XP
            </p>

            <h2 className="mt-3 text-4xl font-bold text-yellow-400">
              {myEntry?.xp || 0}
            </h2>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">

            <p className="text-sm text-gray-400">
              Your Rank
            </p>

            <h2 className="mt-3 text-4xl font-bold text-blue-400">
              #{myRank || "-"}
            </h2>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl">

            <p className="text-sm text-gray-400">
              Your Level
            </p>

            <h2 className="mt-3 text-4xl font-bold text-pink-400">
              {calculateLevel(myEntry?.xp || 0)}
            </h2>

          </div>

        </div>
        {/* SCORING INFO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <Star className="h-5 w-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-cyan-300">
              How does ranking work?
            </h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">📚 Join a Study Session</p>
              <p className="mt-1 text-xs text-gray-400">Earn XP every time you join a live study session with peers.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">💬 Answer Peer Doubts</p>
              <p className="mt-1 text-xs text-gray-400">Help others by answering questions in Anonymous Doubts to gain XP.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">🔥 Maintain Your Streak</p>
              <p className="mt-1 text-xs text-gray-400">Log in and stay active daily to build your streak and boost your rank.</p>
            </div>
          </div>
        </motion.div>

        {/* FILTERS */}
        <div className="mt-10 flex flex-wrap gap-3">

          {["Weekly", "Monthly", "All Time"].map((item) => (

            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition-all duration-300 ${
                filter === item
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-cyan-500/20"
              }`}
            >

              {item}

            </button>

          ))}

        </div>

        {/* PODIUM */}
        {entries.length >= 3 && (

          <div className="mt-16 grid grid-cols-3 items-end gap-6">

            {[entries[1], entries[0], entries[2]].map((entry, i) => {

              const rank =
                i === 0 ? 2 : i === 1 ? 1 : 3;

              const podiumHeight =
                rank === 1
                  ? "h-44"
                  : rank === 2
                  ? "h-36"
                  : "h-28";

              return (

                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex flex-col items-center"
                >

                  <div className="relative">

                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/10 bg-white/10 text-3xl font-bold backdrop-blur-xl">

                      {entry.avatar_url ? (

                        <img
                          src={entry.avatar_url}
                          alt={entry.username}
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        entry.username.charAt(0)

                      )}

                    </div>

                    {rank === 1 && (

                      <div className="absolute -right-3 -top-3 rounded-full bg-yellow-400 p-2 shadow-lg shadow-yellow-400/50">

                        <Medal className="h-5 w-5 text-black" />

                      </div>

                    )}

                  </div>

                  <h3 className="mt-4 text-lg font-bold">
                    {entry.username}
                  </h3>

                  <p className="text-sm text-gray-400">
                    {entry.xp} XP
                  </p>

                  <div
                    className={`mt-5 flex w-full items-end justify-center rounded-t-3xl pb-4 shadow-2xl ${podiumHeight}
                    
                    ${
                      rank === 1
                        ? "bg-gradient-to-b from-yellow-300 to-yellow-600"
                        : rank === 2
                        ? "bg-gradient-to-b from-gray-300 to-gray-500"
                        : "bg-gradient-to-b from-orange-400 to-orange-700"
                    }
                    `}
                  >

                    <span className="text-3xl font-black text-white">
                      #{rank}
                    </span>

                  </div>

                </motion.div>
              );
            })}

          </div>

        )}

        {/* FULL LEADERBOARD */}
        <div ref={listParentRef} className="mt-16 h-[1200px] overflow-y-auto pr-2">
          <div style={{ height: `${listVirtualizer.getTotalSize()}px`, position: "relative" }}>
            {listVirtualizer.getVirtualItems().map((virtualItem) => {
              const entry = entries[virtualItem.index];

              return (
                <div
                  key={entry.id}
                  ref={listVirtualizer.measureElement}
                  data-index={virtualItem.index}
                  style={{
                    transform: `translateY(${virtualItem.start}px)`,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                  }}
                  className="pb-5"
                >
                  <LeaderboardRow
                    entry={entry}
                    index={virtualItem.index}
                    isCurrentUser={entry.user_id === user?.id}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* EMPTY STATE */}
        {entries.length === 0 && (

          <div className="mt-20 flex flex-col items-center justify-center text-center">

            <Trophy className="h-20 w-20 text-cyan-500/20" />

            <h2 className="mt-6 text-3xl font-bold">
              No rankings yet
            </h2>

            <p className="mt-3 text-gray-400">
              Start learning to appear on leaderboard.
            </p>

          </div>

        )}

      </div>

    </div>
  );
};

export default Leaderboard;

