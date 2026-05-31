import { memo, useCallback, useEffect, useMemo, useState } from "react";
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

const DiscoverPeerCard = memo(({ user, isOnline, onConnect, isConnected }: any) => {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{
        scale: 1.03,
        y: -5,
      }}
      className="relative overflow-hidden rounded-[30px] p-6 border border-white/10 bg-white/5 backdrop-blur-2xl hover:border-cyan-400/40 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition" />

      <div className="relative z-10 flex items-center gap-4 mb-5">
        <div className="relative">
          <img
            src={user.avatar_url || "https://i.pravatar.cc/150"}
            alt={user.name}
            loading="lazy"
            decoding="async"
            className="w-16 h-16 rounded-full object-cover border-2 border-cyan-400"
          />

          {isOnline && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-[#020617]" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-gray-400 text-sm">{user.bio || "Passionate learner 🚀"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {(Array.isArray(user.skills) ? user.skills : (user.skills?.split(",") || [])).map((skill: string, index: number) => (
          <span key={index} className="bg-cyan-500/10 border border-cyan-400/10 text-cyan-300 px-3 py-1 rounded-full text-sm">
            {typeof skill === 'string' ? skill.trim() : skill}
          </span>
        ))}
      </div>

      <button
        onClick={() => onConnect(user.id)}
        disabled={isConnected}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition ${
          isConnected
            ? "bg-white/10 text-gray-400 cursor-not-allowed border border-white/10"
            : "bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:opacity-90"
        }`}
      >
        {isConnected ? "Pending" : "Connect"}
      </button>
    </motion.div>
  );
});

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

    const parseArray = (val: any) => {
      if (Array.isArray(val)) return val.map((s: string) => s.toLowerCase().trim());
      if (typeof val === "string") return val.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      return [];
    };

    const userSkills = parseArray(user.skills);
    const userGoals = parseArray(user.learning_goals);
    
    const mySkills = parseArray(currentUser.skills);
    const myGoals = parseArray(currentUser.learning_goals);

    let score = 0;
    
    // Weightings
    const PRIMARY_WEIGHT = 40; // They have what I want
    const SECONDARY_WEIGHT = 30; // I have what they want (mutual exchange)
    const ALIGNMENT_WEIGHT = 10; // We want to learn the same thing (study buddies)

    const maxPossibleScore = 
      (myGoals.length > 0 ? PRIMARY_WEIGHT : 0) +
      (mySkills.length > 0 ? SECONDARY_WEIGHT : 0) +
      (myGoals.length > 0 ? ALIGNMENT_WEIGHT : 0) || 1; // avoid div by 0

    const primaryMatches = userSkills.filter((skill: string) => myGoals.includes(skill)).length;
    if (primaryMatches > 0 && myGoals.length > 0) {
      score += (primaryMatches / myGoals.length) * PRIMARY_WEIGHT;
    }

    const reciprocalMatches = userGoals.filter((goal: string) => mySkills.includes(goal)).length;
    if (reciprocalMatches > 0 && mySkills.length > 0) {
      score += (reciprocalMatches / mySkills.length) * SECONDARY_WEIGHT;
    }

    const studyBuddyMatches = userGoals.filter((goal: string) => myGoals.includes(goal)).length;
    if (studyBuddyMatches > 0 && myGoals.length > 0) {
      score += (studyBuddyMatches / myGoals.length) * ALIGNMENT_WEIGHT;
    }

    let percentage = Math.min(Math.round((score / maxPossibleScore) * 100), 100);

    // Baseline compatibility for active users in the same platform
    if (percentage < 15 && (userSkills.length > 0 || userGoals.length > 0)) {
       percentage = Math.floor(Math.random() * 10) + 15;
    }

    return percentage;
  };

  // FILTER & SCORE USERS (client-side match scoring only)
  useEffect(() => {
    if (!currentUser) return;

    let matched = users
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

  const handleConnect = useCallback(async (peerId: string) => {
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
  }, [connections, currentUser]);

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
              loading="lazy"
              decoding="async"
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
              <DiscoverPeerCard
                key={u.id}
                user={u}
                isOnline={onlineUsers.includes(u.id)}
                onConnect={handleConnect}
                isConnected={connections.includes(u.id)}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Discover;
