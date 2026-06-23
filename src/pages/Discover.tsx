/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useInView } from "react-intersection-observer";
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
import { API_BASE_URL } from "@/config/api";

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

  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const { ref: observerRef, inView } = useInView({
    threshold: 0.1,
  });

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [connections, setConnections] = useState<string[]>([]);

  // DEBOUNCE SEARCH
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // 1. FETCH INITIAL DATA (User Profile & Connections) - Runs ONCE on mount
  useEffect(() => {
    const fetchInitialData = async () => {
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
        console.error("Error fetching initial data:", err);
      }
    };

    fetchInitialData();
  }, []);

  // 2. FETCH PEERS FROM BACKEND - Runs on search/filter change (Reset page)
  useEffect(() => {
    setPage(1);
    const fetchPeers = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        const searchParams = new URLSearchParams();
        if (debouncedSearch.trim()) searchParams.append("search", debouncedSearch.trim());
        if (selectedFilter !== "All") searchParams.append("filter", selectedFilter);
        searchParams.append("limit", "20");
        searchParams.append("page", "1");

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const res = await fetch(`${API_BASE_URL}/api/match/supabase-discover?${searchParams.toString()}`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            },
            credentials:"include"
          });
          const apiData = await res.json();
          if (apiData.success) {
            setUsers(apiData.recommendations || []);
            setFilteredUsers(apiData.recommendations || []);
            setHasNextPage(apiData.hasNextPage);
          }
        }
      } catch (err) {
        console.error("Error fetching peers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPeers();
  }, [debouncedSearch, selectedFilter, currentUser]);

  // 3. FETCH MORE PEERS (Infinite Scroll)
  useEffect(() => {
    if (inView && hasNextPage && !loading && !fetchingMore) {
      const fetchMore = async () => {
        setFetchingMore(true);
        const nextPage = page + 1;
        try {
          const searchParams = new URLSearchParams();
          if (debouncedSearch.trim()) searchParams.append("search", debouncedSearch.trim());
          if (selectedFilter !== "All") searchParams.append("filter", selectedFilter);
          searchParams.append("limit", "20");
          searchParams.append("page", nextPage.toString());

          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const res = await fetch(`${API_BASE_URL}/api/match/supabase-discover?${searchParams.toString()}`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
              credentials: "include"
            });
            const apiData = await res.json();
            if (apiData.success) {
              setUsers((prev) => [...prev, ...apiData.recommendations]);
              setFilteredUsers((prev) => [...prev, ...apiData.recommendations]);
              setHasNextPage(apiData.hasNextPage);
              setPage(nextPage);
            }
          }
        } catch (err) {
          console.error("Error fetching more peers:", err);
        } finally {
          setFetchingMore(false);
        }
      };

      fetchMore();
    }
  }, [inView, hasNextPage, loading, fetchingMore, page, debouncedSearch, selectedFilter]);

  // PRESENCE
  useEffect(() => {
    if (!currentUser?.id) return;

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
  }, [currentUser?.id]);

  // Match scoring has been moved to the Node.js backend to prevent O(N) payload bloat and severe UI jank

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
                className="rounded-[30px] p-6 border border-white/10 bg-white/5 animate-pulse"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-full bg-white/10" />

                  <div className="flex-1">
                    <div className="h-5 w-32 rounded bg-white/10 mb-2" />
                    <div className="h-4 w-24 rounded bg-white/10" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  <div className="h-7 w-16 rounded-full bg-white/10" />
                  <div className="h-7 w-20 rounded-full bg-white/10" />
                  <div className="h-7 w-14 rounded-full bg-white/10" />
                </div>

                <div className="h-12 rounded-2xl bg-white/10" />
              </div>
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
          <>
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
            
            {/* Infinite Scroll Trigger */}
            <div ref={observerRef} className="py-8 flex justify-center">
              {fetchingMore && (
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-100" />
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce delay-200" />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Discover;

