import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

import {
  Calendar,
  Users,
  Clock,
  Flame,
  Send,
  Search,
  Sparkles,
  Video,
  Plus,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import VideoRoom from "@/components/VideoRoom";
import { useAwardXP } from "@/hooks/useAwardXP";
import { CreateSessionDialog } from "@/components/CreateSessionDialog";
import { generateICS } from "@/utils/calendar";

const tabs = [
  "Upcoming",
  "Joined",
  "Completed",
];

const Sessions = () => {
  const { user } = useAuth();
  const { mutate: awardXP } = useAwardXP();

  const [sessions, setSessions] = useState<any[]>([]);
  const [filteredSessions, setFilteredSessions] =
    useState<any[]>([]);

  const [messages, setMessages] = useState<any[]>([]);

  const [selectedTab, setSelectedTab] =
    useState("Upcoming");

  const [selectedSession, setSelectedSession] =
    useState<any>(null);

  const [message, setMessage] = useState("");

  const [activities, setActivities] = useState<any[]>([]);

  const [userStatus, setUserStatus] = useState("Active");
  
  const [isTyping, setIsTyping] = useState(false);

  const [search, setSearch] = useState("");

  const [isVideoActive, setIsVideoActive] = useState(false);

  const [studyTime, setStudyTime] = useState(60 * 60); // 1 hour

  const messagesEndRef = useRef<any>(null);
  
  // Track sessions that have already granted XP to prevent infinite farming
  const awardedSessions = useRef<Set<string>>(new Set());

  // FETCH SESSIONS
  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await (supabase as any)
        .from("sessions")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.log(error);
      } else {
        setSessions(data);

        if (data.length > 0) {
          setSelectedSession(data[0]);
        }
      }
    };

    fetchSessions();
  }, []);

  // FILTER SESSIONS
  useEffect(() => {
    let filtered = sessions;

    // TAB FILTER
    filtered = filtered.filter(
      (s) =>
        s.status?.toLowerCase() ===
        selectedTab.toLowerCase()
    );

    // SEARCH
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.title
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          s.tags
            ?.join(" ")
            .toLowerCase()
            .includes(search.toLowerCase())
      );
    }

    setFilteredSessions(filtered);
  }, [sessions, selectedTab, search]);

  // FETCH MESSAGES
  useEffect(() => {
    if (!selectedSession) return;

    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("session_id", selectedSession.id)
        .order("created_at", {
          ascending: true,
        });

      setMessages(data || []);
    };

    fetchMessages();

    setActivities((prev) => [
        {
          id: Date.now(),
          text: `${user?.user_metadata?.full_name || "Someone"} joined the session`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        ...prev,
      ]);

    // REALTIME
    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload: any) => {
          if (
            payload.new.session_id ===
            selectedSession.id
          ) {
            setMessages((prev) => [
              ...prev,
              payload.new,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSession]);

  // STUDY TIMER
    useEffect(() => {
      const timer = setInterval(() => {
        setStudyTime((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }

          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    const formatTime = (time: number) => {
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      const seconds = time % 60;

      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    };

  // AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!message.trim() || !selectedSession) return;

    setActivities((prev) => [
        {
          id: Date.now(),
          text: `${user?.user_metadata?.full_name || "Someone"} is participating in discussion`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        ...prev,
      ]);

    await (supabase as any)
      .from("messages")
      .insert({
        session_id: selectedSession.id,
        user_id: user?.id,
        username:
          user?.user_metadata?.full_name ||
          "Anonymous",
        message,
      });

    setMessage("");
    
   setActivities((prev) => [
      {
        id: Date.now(),
        text: `${user?.user_metadata?.full_name || "Someone"} sent a message`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">
      
      {/* BACKGROUND */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full" />

      <div className="relative z-10 p-6">

        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">
            Sessions
          </h1>

          <p className="text-gray-400">
            Join collaborative learning sessions 🚀
          </p>
        </div>

        {/* SEARCH */}
        <div className="relative mb-6">
          <Search
            className="absolute left-5 top-4 text-gray-400"
            size={20}
          />

          <input
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => {
            setMessage(e.target.value);

            setIsTyping(true);

            setTimeout(() => {
              setIsTyping(false);
            }, 1500);
          }}
            className="w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-cyan-400 transition"
          />
        </div>

        {/* TABS & CREATE SESSION */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex gap-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() =>
                  setSelectedTab(tab)
                }
                className={`px-6 py-3 rounded-2xl transition-all whitespace-nowrap ${
                  selectedTab === tab
                    ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold shadow-lg shadow-cyan-500/20"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <CreateSessionDialog
            onSessionCreated={() => {
              window.location.reload();
            }}
          >
            <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-black px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition">
              <Plus size={20} />
              Create Session
            </button>
          </CreateSessionDialog>
        </div>

        {/* CONTENT */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* LEFT SIDE */}
          <div className="lg:col-span-2">

            {/* TITLE */}
            <div className="flex items-center gap-2 mb-6">
              <Flame className="text-orange-400" />

              <h2 className="text-2xl font-bold">
                Live Learning Sessions
              </h2>
            </div>

            {/* SESSIONS */}
            {isVideoActive && selectedSession ? (
              <VideoRoom 
                roomName={selectedSession.id} 
                userName={user?.user_metadata?.full_name || "Anonymous Learner"} 
                onLeave={() => setIsVideoActive(false)} 
              />
            ) : (
            <div className="grid gap-5">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((s) => (
                  <motion.div
                    whileHover={{
                      scale: 1.02,
                    }}
                    key={s.id}
                    onClick={() =>
                      setSelectedSession(s)
                    }
                    className={`cursor-pointer rounded-3xl p-6 border backdrop-blur-xl transition-all ${
                      selectedSession?.id === s.id
                        ? "border-cyan-400 bg-cyan-500/10"
                        : "border-white/10 bg-white/5 hover:border-cyan-400/30"
                    }`}
                  >
                    {/* LIVE BADGE */}
                    {s.is_live && (
                      <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-400/20 text-red-400 px-3 py-1 rounded-full text-sm mb-4">
                        🔴 LIVE NOW
                      </div>
                    )}

                    {/* TITLE */}
                    <h2 className="text-2xl font-bold mb-3">
                      {s.title}
                    </h2>

                    {/* DESCRIPTION */}
                    <p className="text-gray-300 mb-5">
                      {s.description}
                    </p>

                    {/* DETAILS */}
                    <div className="flex flex-wrap gap-5 text-sm text-gray-400 mb-5">

                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        {s.timing || "Today"}
                      </div>

                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        {s.participants || 0} learners
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        {s.duration || "1 Hour"}
                      </div>
                    </div>

                    {/* MENTOR */}
                    <div className="mb-5">
                      <p className="text-gray-400 text-sm">
                        Mentor
                      </p>

                      <p className="font-semibold">
                        {s.mentor || "Sarah"}
                      </p>
                    </div>

                    {/* TAGS */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {s.tags?.map(
                        (
                          tag: string,
                          index: number
                        ) => (
                          <span
                            key={index}
                            className="bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-3 py-1 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        )
                      )}
                    </div>

                    {/* BUTTONS */}
                    <div className="flex gap-3">
                      <button className="flex-1 bg-gradient-to-r from-cyan-400 to-purple-500 text-black py-3 rounded-2xl font-bold hover:opacity-90 transition">
                        Join Session
                      </button>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          generateICS(
                            s.title || "Peer Learning Session",
                            s.description || "Join us for a collaborative learning session.",
                            s.scheduled_at ? new Date(s.scheduled_at) : new Date(),
                            1
                          );
                        }}
                        className="bg-white/10 border border-white/10 hover:bg-white/20 p-3 rounded-2xl transition text-white"
                        title="Add to Calendar"
                      >
                        <Calendar size={24} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 border border-white/10 rounded-3xl bg-white/5">
                  <Sparkles
                    className="mx-auto text-gray-500 mb-4"
                    size={50}
                  />

                  <h2 className="text-2xl font-bold mb-2">
                    No Sessions Found
                  </h2>

                  <p className="text-gray-400">
                    Try another tab or search.
                  </p>
                </div>
              )}
            </div>
            )}
          </div>

          {/* RIGHT SIDE CHAT */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-5 flex flex-col h-[750px]">
            {selectedSession ? (
              <>
                {/* CHAT HEADER */}
                <div className="pb-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Session Chat 💬
                </h2>

                <p className="text-gray-400 text-sm">
                  {selectedSession?.title}
                </p>

                <div className="flex flex-col gap-3 mt-4">

                <div className="flex flex-wrap gap-3">

                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-400/20 text-green-300 px-3 py-1 rounded-full text-sm w-fit">
                  🟢 42 learners online
                </div>

                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border w-fit ${
                    userStatus === "Active"
                      ? "bg-cyan-500/10 border-cyan-400/20 text-cyan-300"
                      : "bg-yellow-500/10 border-yellow-400/20 text-yellow-300"
                  }`}
                >
                  {userStatus === "Active" ? "⚡" : "🌙"}
                  {userStatus}
                </div>
              </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">
                      Shared Study Timer
                    </h3>

                    <span className="text-cyan-300 font-mono text-lg">
                      {formatTime(studyTime)}
                    </span>
                  </div>

                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full transition-all duration-1000"
                      style={{
                        width: `${(studyTime / 3600) * 100}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Synchronized collaborative study session timer
                  </p>
                </div>
              </div>
              </div>
              
              {isVideoActive && (
              <div className="mb-3 bg-purple-500/10 border border-purple-400/20 text-purple-300 px-3 py-2 rounded-xl text-sm">
                🎥 Collaborative video study session is active
              </div>
            )}

              {selectedSession && !isVideoActive && (
                <button 
                  onClick={() => {
                    setIsVideoActive(true);
                    // Prevent infinite XP farming loophole
                    if (!awardedSessions.current.has(selectedSession.id)) {
                      awardXP({ activity: 'session_join' });
                      awardedSessions.current.add(selectedSession.id);
                    }
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-black px-4 py-2 rounded-2xl font-bold hover:opacity-90 transition"
                >
                  <Video size={18} /> Join Video
                </button>
              )}
              {selectedSession && isVideoActive && (
                <button 
                  onClick={() => setIsVideoActive(false)}
                  className="flex items-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-2 rounded-2xl font-bold hover:bg-white/20 transition"
                >
                  Leave Video
                </button>
              )}
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto py-5 space-y-4">
              {messages.map((msg, index) => {
                const isCurrentUser =
                  msg.user_id === user?.id;

                return (
                  <div
                    key={index}
                    className={`flex ${
                      isCurrentUser
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                        isCurrentUser
                          ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-black"
                          : "bg-white/10"
                      }`}
                    >
                      {!isCurrentUser && (
                        <p className="text-xs text-cyan-300 mb-1">
                          {msg.username}
                        </p>
                      )}

                      <p>{msg.message}</p>

                      <p className="text-[10px] opacity-70 mt-2">
                        {new Date(
                          msg.created_at
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>



           {/* TYPING INDICATOR */}
            {isTyping && (
              <div className="mb-4 bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-4 py-3 rounded-2xl text-sm animate-pulse">
                Someone is typing in the collaborative session...
              </div>
            )}
     
          {/* ACTIVITY FEED */}
            <div className="border-t border-white/10 pt-4 mb-4">

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  ⚡ Live Activity
                </h3>

                <span className="text-xs text-cyan-300">
                  Real-time updates
                </span>
              </div>

              <div className="space-y-3 max-h-40 overflow-y-auto">

                {activities.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No recent activity yet.
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="bg-white/5 border border-white/10 rounded-xl p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white">
                          {activity.text}
                        </p>

                        <span className="text-xs text-gray-400">
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}

              </div>
            </div>

            {/* INPUT */}
            <div className="pt-4 border-t border-white/10 flex gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
                className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400"
              />

              <button
                onClick={sendMessage}
                className="bg-gradient-to-r from-cyan-400 to-purple-500 text-black p-4 rounded-2xl hover:opacity-90 transition"
              >
                <Send size={20} />
              </button>
            </div>
            </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-gray-500 flex-col gap-3">
                <Sparkles size={40} className="text-cyan-500/30" />
                <p>Select or create a session to join the chat</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sessions;