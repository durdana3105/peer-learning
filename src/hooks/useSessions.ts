import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAwardXP } from "@/hooks/useAwardXP";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";
import { joinSession } from "@/lib/joinSession";

const UPCOMING_STATUSES = new Set(["scheduled", "live", "upcoming"]);
const COMPLETED_STATUSES = new Set(["ended", "completed", "cancelled"]);

export function useSessions(user: any) {
  const { mutate: awardXP } = useAwardXP();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<any[]>([]);
  const [joinedSessionIds, setJoinedSessionIds] = useState<Set<string | number>>(
    new Set(),
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState("Upcoming");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [search, setSearch] = useState("");

  const [activities, setActivities] = useState<any[]>([]);
  const [userStatus, setUserStatus] = useState("Active");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [studyTime, setStudyTime] = useState(60 * 60);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const channelRef = useRef<any>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastMoveRef = useRef(0);
  const awardedSessionsRef = useRef<Set<string | number>>(new Set());

  const refetchSessions = useCallback(async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setSessions(data);
      setSelectedSession((current) => {
        if (!current) return data[0] ?? null;
        return data.find((session) => session.id === current.id) ?? data[0] ?? null;
      });
    }

    if (user?.id) {
      const { data: joinedRows } = await (supabase as any)
        .from("session_participants")
        .select("session_id")
        .eq("user_id", user.id);

      setJoinedSessionIds(
        new Set((joinedRows || []).map((row: { session_id: string | number }) => row.session_id)),
      );
    }
  }, [user?.id]);

  useEffect(() => {
    void refetchSessions();
  }, [refetchSessions]);

  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    if (selectedTab === "Joined") {
      filtered = filtered.filter((session) => joinedSessionIds.has(session.id));
    } else if (selectedTab === "Completed") {
      filtered = filtered.filter((session) =>
        COMPLETED_STATUSES.has(session.status?.toLowerCase() ?? ""),
      );
    } else {
      filtered = filtered.filter((session) =>
        UPCOMING_STATUSES.has(session.status?.toLowerCase() ?? ""),
      );
    }

    if (search) {
      filtered = filtered.filter(
        (session) =>
          session.title?.toLowerCase().includes(search.toLowerCase()) ||
          session.tags?.join(" ").toLowerCase().includes(search.toLowerCase()),
      );
    }

    return filtered;
  }, [sessions, selectedTab, search, joinedSessionIds]);

  useEffect(() => {
    if (!selectedSession) return;

    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("session_id", selectedSession.id)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    };

    fetchMessages();

    const roomChannel = supabase.channel(`room:${selectedSession.id}`, {
      config: {
        presence: {
          key: user?.id || "anonymous",
        },
      },
    });

    channelRef.current = roomChannel;

    roomChannel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload: any) => {
        if (payload.new.session_id === selectedSession.id) {
          setMessages((prev) => [...prev, payload.new]);
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = roomChannel.presenceState();
        setParticipantCount(Math.max(1, Object.keys(state).length));
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user === (user?.user_metadata?.full_name || "Someone")) return;
        setTypingUser(payload.user);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      })
      .on("broadcast", { event: "activity" }, ({ payload }) => {
        setActivities((prev) => [payload, ...prev]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await roomChannel.track({ online_at: new Date().toISOString() });

          roomChannel.send({
            type: "broadcast",
            event: "activity",
            payload: {
              id: Date.now(),
              text: `${user?.user_metadata?.full_name || "Someone"} joined the session`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          });
        }
      });

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [selectedSession, user]);

  useEffect(() => {
    if (!selectedSession) return;
    const timer = setInterval(() => {
      const start = new Date(selectedSession.start_time || selectedSession.created_at).getTime();
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(0, 3600 - elapsed);

      setStudyTime(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSession]);

  useEffect(() => {
    const handleActivity = () => {
      setUserStatus("Active");
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setUserStatus("Idle");
      }, 15000);
    };

    const throttledMove = () => {
      const now = Date.now();
      if (now - lastMoveRef.current < 200) return;
      lastMoveRef.current = now;
      handleActivity();
    };

    window.addEventListener("mousemove", throttledMove, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("click", handleActivity, { passive: true });

    handleActivity();

    return () => {
      clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", throttledMove);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, []);

  const handleJoinSession = useCallback(async (e: React.MouseEvent, sessionId: string | number) => {
    e.stopPropagation();
    try {
      const { error, alreadyJoined } = await joinSession(sessionId, user?.id);

      if (error) {
        if (error.message.includes("Session is full")) {
          toast({
            title: "Session Full",
            description: "This session has reached its seat limit.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Success!", description: "You have joined the session." });

        if (!alreadyJoined) {
          awardedSessionsRef.current.add(sessionId);
          awardXP({ activity: "session_join" });
        }

        setJoinedSessionIds((prev) => new Set(prev).add(sessionId));
        await refetchSessions();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to join session.",
        variant: "destructive",
      });
    }
  }, [user?.id, awardXP, toast, refetchSessions]);

  const sendMessage = useCallback(async (msgText: string) => {
    if (!msgText.trim() || !selectedSession) return;

    const activity = {
      id: Date.now(),
      text: `${user?.user_metadata?.full_name || "Someone"} sent a message`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "activity",
        payload: activity,
      });
    }

    await (supabase as any)
      .from("messages")
      .insert({
        session_id: selectedSession.id,
        user_id: user?.id,
        username: user?.user_metadata?.full_name || "Anonymous",
        message: msgText,
      });
  }, [selectedSession, user]);

  const sendTypingEvent = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { user: user?.user_metadata?.full_name || "Someone" },
      });
    }
  }, [user]);

  const handleLeaveVideo = useCallback(async () => {
    setIsVideoActive(false);

    if (!selectedSession || messages.length === 0) return;

    try {
      setSummaryLoading(true);

      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${API_BASE_URL}/api/ai/generate-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate summary");
      }

      const parsedData = await res.json();
      setSessionSummary(parsedData);

      await (supabase as any)
        .from("session_summaries")
        .insert({
          session_id: selectedSession.id,
          summary: parsedData.summary,
          key_takeaways: parsedData.key_takeaways || [],
        });
    } catch (error) {
      console.error("Summary generation failed", error);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedSession, messages]);

  const handleJoinVideo = useCallback(() => {
    setIsVideoActive(true);
    if (selectedSession && !awardedSessionsRef.current.has(selectedSession.id)) {
      awardedSessionsRef.current.add(selectedSession.id);
      awardXP({ activity: "session_join" });
    }
  }, [awardXP, selectedSession]);

  return {
    sessions,
    filteredSessions,
    messages,
    selectedTab,
    setSelectedTab,
    selectedSession,
    setSelectedSession,
    search,
    setSearch,
    activities,
    userStatus,
    typingUser,
    participantCount,
    isVideoActive,
    sessionSummary,
    summaryLoading,
    studyTime,
    handleJoinSession,
    sendMessage,
    sendTypingEvent,
    handleLeaveVideo,
    handleJoinVideo,
    refetchSessions,
  };
}

export function useSessionRoom(session: any, user: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [userStatus, setUserStatus] = useState("Active");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [studyTime, setStudyTime] = useState(60 * 60);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const channelRef = useRef<any>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastMoveRef = useRef(0);

  useEffect(() => {
    if (!session) return;

    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    };

    fetchMessages();

    const roomChannel = supabase.channel(`room:${session.id}`, {
      config: {
        presence: {
          key: user?.id || "anonymous",
        },
      },
    });

    channelRef.current = roomChannel;

    roomChannel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload: any) => {
        if (payload.new.session_id === session.id) {
          setMessages((prev) => [...prev, payload.new]);
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = roomChannel.presenceState();
        setParticipantCount(Math.max(1, Object.keys(state).length));
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user === (user?.user_metadata?.full_name || "Someone")) return;
        setTypingUser(payload.user);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      })
      .on("broadcast", { event: "activity" }, ({ payload }) => {
        setActivities((prev) => [payload, ...prev]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await roomChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [session, user]);

  useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      const start = new Date(session.start_time || session.created_at).getTime();
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(0, 3600 - elapsed);
      setStudyTime(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  useEffect(() => {
    const handleActivity = () => {
      setUserStatus("Active");
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setUserStatus("Idle"), 15000);
    };

    const throttledMove = () => {
      const now = Date.now();
      if (now - lastMoveRef.current < 200) return;
      lastMoveRef.current = now;
      handleActivity();
    };

    window.addEventListener("mousemove", throttledMove, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("click", handleActivity, { passive: true });
    handleActivity();

    return () => {
      clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", throttledMove);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
    };
  }, []);

  const sendMessage = useCallback(async (msgText: string) => {
    if (!msgText.trim() || !session) return;

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "activity",
        payload: {
          id: Date.now(),
          text: `${user?.user_metadata?.full_name || "Someone"} sent a message`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      });
    }

    await (supabase as any).from("messages").insert({
      session_id: session.id,
      user_id: user?.id,
      username: user?.user_metadata?.full_name || "Anonymous",
      message: msgText,
    });
  }, [session, user]);

  const sendTypingEvent = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { user: user?.user_metadata?.full_name || "Someone" },
    });
  }, [user]);

  const handleLeaveVideo = useCallback(() => setIsVideoActive(false), []);
  const handleJoinVideo = useCallback(() => setIsVideoActive(true), []);

  return {
    messages,
    activities,
    userStatus,
    typingUser,
    participantCount,
    isVideoActive,
    sessionSummary,
    summaryLoading,
    studyTime,
    sendMessage,
    sendTypingEvent,
    handleLeaveVideo,
    handleJoinVideo,
  };
}
