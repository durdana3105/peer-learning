import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Sparkles,
  Users,
  Bell,
  Flame,
  UserPlus,
  Zap,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { Check } from "lucide-react";

const filters = [
  "All",
  "AI/ML",
  "Web Dev",
  "DSA",
  "Design",
  "Python",
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  show: {
    opacity: 1,
    y: 0,
  },
};

const Discover = () => {
  const [currentUser, setCurrentUser] =
    useState<any>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] =
    useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [connections, setConnections] = useState<string[]>([]);

  // DEBOUNCE SEARCH
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // FETCH USERS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;

        if (!user) {
          setLoading(false);
          return;
        }

        // CURRENT USER
        const { data: current } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setCurrentUser(current);

        // ALL USERS — capped at 100 and filtered server-side
        let query = supabase
          .from("profiles")
          .select("*")
          .neq("id", user.id)
          .limit(100);

        // Server-side search: filter by name or skills using ilike
        if (debouncedSearch.trim()) {
          // Escape double quotes so we can wrap the search term in quotes, preventing commas from breaking the .or() syntax
          const safeSearch = debouncedSearch.trim().replace(/"/g, '""');
          query = query.or(
            `name.ilike."%${safeSearch}%",skills.ilike."%${safeSearch}%"`
          );
        }

        // Server-side skill filter
        if (selectedFilter !== "All") {
          query = query.ilike("skills", `%${selectedFilter}%`);
        }

        const { data: allUsers } = await query;

        setUsers(allUsers || []);

        // FETCH CONNECTIONS
        const { data: conns } = await (supabase as any)
          .from("peer_connections")
          .select("sender_id, receiver_id")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
        
        if (conns) {
          const connectedIds = conns.map((c: any) => c.sender_id === user.id ? c.receiver_id : c.sender_id);
          setConnections(connectedIds);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearch, selectedFilter]);

  // PRESENCE
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeIds = Object.keys(state);
        setOnlineUsers(activeIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // MATCH SCORE
  const getMatchScore = (user: any) => {
    if (!currentUser) return 0;

    const userSkills = Array.isArray(user.skills)
      ? user.skills.map((s: string) => s.toLowerCase())
      : (user.skills?.split(",") || []).map((s: string) => s.trim().toLowerCase());

    const myGoals = Array.isArray(currentUser.learning_goals)
      ? currentUser.learning_goals.map((s: string) => s.toLowerCase())
      : (currentUser.learning_goals?.split(",") || []).map((s: string) => s.trim().toLowerCase());

    return userSkills.filter((skill: string) =>
      myGoals.includes(skill)
    ).length;
  };

  // FILTER & SCORE USERS (client-side match scoring only)
  useEffect(() => {
    if (!currentUser) return;

    const matched = users
      .map((u) => ({
        ...u,
        score: getMatchScore(u),
      }));

    // SEARCH
    if (search) {
      matched = matched.filter((u) => {
        const skillsStr = Array.isArray(u.skills)
          ? u.skills.join(" ").toLowerCase()
          : (u.skills || "").toLowerCase();
        return (
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          skillsStr.includes(search.toLowerCase())
        );
      });
    }

    // FILTERS
    if (selectedFilter !== "All") {
      matched = matched.filter((u) => {
        const skillsList = Array.isArray(u.skills)
          ? u.skills.map((s: string) => s.toLowerCase())
          : (u.skills?.split(",") || []).map((s: string) => s.trim().toLowerCase());
        return skillsList.some((skill: string) =>
          skill.includes(selectedFilter.toLowerCase())
        );
      });
    }

    // DEFAULT BUBBLE
    // If no search and no filter are active, only show recommended peers (score > 0)
    if (!search && selectedFilter === "All") {
      matched = matched.filter((u) => u.score > 0);
    }

    matched.sort((a, b) => b.score - a.score);

    setFilteredUsers(matched);
  }, [users, currentUser, search, selectedFilter]);

  const handleConnect = async (peerId: string) => {
    if (!currentUser || connections.includes(peerId)) return;

    setConnections((prev) => [...prev, peerId]);

    const { error } = await (supabase as any).from("peer_connections").insert({
      sender_id: currentUser.id,
      receiver_id: peerId,
      status: 'pending'
    });

    if (!error) {
      await (supabase as any).from("notifications").insert({
        user_id: peerId,
        type: 'system',
        title: 'New Connection Request',
        body: `${currentUser.name || 'Someone'} wants to connect with you!`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">
      
      {/* BACKGROUND BLUR */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full" />

      <div className="relative z-10 px-6 py-6">

        {/* NAVBAR */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold">
              Discover
            </h1>

            <p className="text-gray-400 mt-1">
              Netflix for Learning 🚀
            </p>
          </div>

          <div className="flex items-center gap-4">
            <NotificationsDropdown />

            <img
              src={
                currentUser?.avatar_url ||
                "https://i.pravatar.cc/150"
              }
              alt="avatar"
              className="w-12 h-12 rounded-full border-2 border-cyan-400 object-cover"
            />
          </div>
        </div>

        {/* HERO */}
        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="relative overflow-hidden rounded-[32px] p-10 mb-10 border border-white/10 bg-white/5 backdrop-blur-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 px-4 py-2 rounded-full mb-5 border border-cyan-400/20">
              <Sparkles size={16} />
              AI Powered Recommendations
            </div>

            <h1 className="text-5xl font-bold leading-tight mb-4">
              Find Your Perfect
              <br />
              Learning Partner
            </h1>

            <p className="text-gray-300 text-lg max-w-2xl">
              Discover peers based on your goals,
              skills, interests, and learning vibe.
            </p>
          </div>
        </motion.div>

        {/* SEARCH */}
        <div className="relative mb-6">
          <Search
            className="absolute left-5 top-4 text-gray-400"
            size={20}
          />

          <input
            type="text"
            placeholder="Search peers, skills, sessions..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-cyan-400 transition"
          />
        </div>

        {/* FILTER CHIPS */}
        <div className="flex gap-3 overflow-x-auto mb-10 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() =>
                setSelectedFilter(filter)
              }
              className={`px-5 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
                selectedFilter === filter
                  ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold shadow-lg shadow-cyan-500/20"
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* TITLE */}
        <div className="flex items-center gap-3 mb-6">
          <Flame className="text-orange-400" />

          <h2 className="text-3xl font-bold">
            Recommended Peers
          </h2>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-72 rounded-[28px] bg-white/5 animate-pulse border border-white/10"
              />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-24">
            <Users
              size={70}
              className="mx-auto text-gray-500 mb-6"
            />

            <h2 className="text-3xl font-bold mb-3">
              No Matches Found 😔
            </h2>

            <p className="text-gray-400">
              Try another skill or search term.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-3 gap-6"
          >
            {filteredUsers.map((u) => (
              <motion.div
                key={u.id}
                variants={cardVariants}
                whileHover={{
                  scale: 1.03,
                  y: -5,
                }}
                className="relative overflow-hidden rounded-[30px] p-6 border border-white/10 bg-white/5 backdrop-blur-2xl hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300"
              >
                {/* GLOW */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition" />

                {/* TOP */}
                <div className="relative z-10 flex items-center gap-4 mb-5">
                  <div className="relative">
                    <img
                      src={
                        u.avatar_url ||
                        "https://i.pravatar.cc/150"
                      }
                      alt={u.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400"
                    />

                    {/* ONLINE */}
                    {onlineUsers.includes(u.id) && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-[#020617]" />
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">
                      {u.name}
                    </h2>

                    <p className="text-gray-400 text-sm">
                      {u.bio ||
                        "Passionate learner 🚀"}
                    </p>
                  </div>
                </div>

                {/* STREAK */}
                {u.streak > 0 && (
                  <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-400/20 text-orange-300 px-4 py-2 rounded-xl mb-5 w-fit">
                    <Zap size={16} />
                    {u.streak} Day Learning Streak
                  </div>
                )}

                {/* SKILLS */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {(Array.isArray(u.skills) ? u.skills : (u.skills?.split(",") || [])).map(
                    (
                      skill: string,
                      index: number
                    ) => (
                      <span
                        key={index}
                        className="bg-cyan-500/10 border border-cyan-400/10 text-cyan-300 px-3 py-1 rounded-full text-sm"
                      >
                        {typeof skill === 'string' ? skill.trim() : skill}
                      </span>
                    )
                  )}
                </div>

                {/* GOALS */}
                <div className="mb-5">
                  <p className="text-gray-400 text-sm mb-2">
                    Learning Goals
                  </p>

                  <p className="text-sm leading-relaxed text-gray-200">
                    {u.learning_goals}
                  </p>
                </div>

                {/* MATCH */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm text-gray-400">
                      Compatibility
                    </p>

                    <div className="bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-full text-sm border border-cyan-400/20">
                      {u.score}% Match 🔥
                    </div>
                  </div>

                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width: `${u.score}%`,
                      }}
                      transition={{
                        duration: 1,
                      }}
                      className="h-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                    />
                  </div>
                </div>

                {/* BUTTON */}
                <button
                  onClick={() => handleConnect(u.id)}
                  disabled={connections.includes(u.id)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition ${
                    connections.includes(u.id)
                      ? "bg-white/10 text-gray-400 cursor-not-allowed border border-white/10"
                      : "bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:opacity-90"
                  }`}
                >
                  {connections.includes(u.id) ? (
                    <>
                      <Check size={18} />
                      Pending
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Connect
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Discover;
