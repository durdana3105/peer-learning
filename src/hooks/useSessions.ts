import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAwardXP } from "@/hooks/useAwardXP";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/api";
// UI tab labels don't match the DB's session status values, so each tab
// must be translated to the status (or statuses) it represents before filtering.
const TAB_TO_STATUS: Record<string, string[]> = {
  Upcoming: ["scheduled"],
  Joined: ["live"],
  Completed: ["ended"],
};

export function useSessions(user: any) {
  const { mutate: awardXP } = useAwardXP();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState("Upcoming");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [search, setSearch] = useState("");

  const [activities, setActivities] = useState<any[]>([]);
  const [userStatus, setUserStatus] = useState("Active");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const isFocusModeRef = useRef(isFocusMode);

  useEffect(() => {
    isFocusModeRef.current = isFocusMode;
    if (isFocusMode) {
      setUserStatus("Busy");
    } else {
      setUserStatus("Active");
    }
  }, [isFocusMode]);

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

  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setSessions(data);
        if (data.length > 0) {
          setSelectedSession(data[0]);
        }
      }
    };

    fetchSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Derive allowed statuses from the single source of truth: TAB_TO_STATUS
    const allowedStatuses = TAB_TO_STATUS[selectedTab] || [];

    filtered = filtered.filter((s) =>
      allowedStatuses.includes(s.status?.toLowerCase())
    );

    // Apply search if present
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.title?.toLowerCase().includes(search.toLowerCase()) ||
          s.tags?.join(" ").toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  }, [sessions, selectedTab, search]);

  // Keep the selected session in sync with the active tab/filter.
  // If the currently selected session isn't in the filtered list anymore
  // (e.g. the user switched tabs), fall back to the first filtered session,
  // or clear the selection if the filtered list is empty.
  useEffect(() => {
    const stillVisible =
      selectedSession &&
      filteredSessions.some((s) => s.id === selectedSession.id);

    if (!stillVisible) {
      setSelectedSession(filteredSessions.length > 0 ? filteredSessions[0] : null);
    }
  }, [filteredSessions, selectedTab, selectedSession]);

  // Reset per-session UI state immediately whenever the selected session
  // changes (or is cleared):
  // - participantCount: without this, switching sessions can briefly show
  //   the previous session's headcount until the new session's presence
  //   sync event comes in and overwrites it with the real number.
  // - sessionSummary: without this, a summary generated for a previous
  //   video session can keep showing after switching to a different
  //   session, making it look like it belongs to the new one.
  // - messages: without this, the previous session's thread stays rendered
  //   for the whole fetch round-trip after switching.
  useEffect(() => {
    setParticipantCount(1);
    setSessionSummary(null);
    setMessages([]);
  }, [selectedSession]);

  useEffect(() => {
    if (!selectedSession) return;

    const fetchMessages = async () => {
      const { data, error } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("session_id", selectedSession.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch messages:", error);
        toast({ title: "Error", description: "Failed to load messages.", variant: "destructive" });
        return;
      }

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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `session_id=eq.${selectedSession.id}` }, (payload: any) => {
        if (payload.new.session_id === selectedSession.id) {
          setMessages((prev) => [...prev, payload.new]);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `session_id=eq.${selectedSession.id}` }, (payload: any) => {
        if (payload.new.session_id === selectedSession.id) {
          setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
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
  }, [selectedSession, user, toast]);

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
      if (isFocusModeRef.current) return;
      setUserStatus("Active");
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (!isFocusModeRef.current) {
          setUserStatus("Idle");
        }
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

  const handleJoinSession = useCallback(async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      const { data: existingParticipant } = await (supabase as any)
        .from("session_participants")
        .select("*")
        .eq("session_id", sessionId)
        .eq("user_id", user?.id)
        .maybeSingle();

      const { error } = await supabase.rpc("join_session", { p_session_id: sessionId });
      if (error) {
        if (error.message.includes("Session is full")) {
          toast({ title: "Session Full", description: "This session has reached its seat limit.", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Success! 🎉", description: "You have joined the session." });

        // Only award XP here, after join_session has actually succeeded and
        // confirmed the user as a participant. This is the single source of
        // truth for "session_join" XP — handleJoinVideo must NOT award it,
        // since opening the video does not by itself confirm participation.
        if (!existingParticipant) {
          awardedSessionsRef.current.add(sessionId);
          awardXP({ activity: "session_join" });
        }
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to join session.", variant: "destructive" });
    }
  }, [user, awardXP, toast]);

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

    try {
      const { error } = await (supabase as any)
        .from("messages")
        .insert({
          session_id: selectedSession.id,
          user_id: user?.id,
          username: user?.user_metadata?.full_name || "Anonymous",
          message: msgText,
        });

      if (error) throw error;
    } catch (err: any) {
      toast({ title: "Failed to send message", description: err.message || "An unexpected error occurred.", variant: "destructive" });
    }
  }, [selectedSession, user, toast]);

  const togglePinMessage = useCallback(async (messageId: string, currentPinnedState: boolean) => {
    if (!selectedSession) return;
    try {
      const { error } = await (supabase as any)
        .from("messages")
        .update({ is_pinned: !currentPinnedState })
        .eq("id", messageId)
        .eq("session_id", selectedSession.id);
        
      if (error) throw error;
      
      // Optimistic UI update
      setMessages((prev) => prev.map(msg => msg.id === messageId ? { ...msg, is_pinned: !currentPinnedState } : msg));
      
      if (!currentPinnedState) {
        toast({ title: "Message Pinned", description: "This message is now pinned to the top of the chat." });
      }
    } catch (err: any) {
      toast({ title: "Failed to update pin status", description: err.message || "An unexpected error occurred.", variant: "destructive" });
    }
  }, [selectedSession, toast]);

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

  // NOTE: This no longer awards "session_join" XP. Opening the video call is
  // not proof of confirmed participation — only a successful `join_session`
  // RPC call (handled in handleJoinSession) confirms that, so that's the
  // only place XP is granted. This closes the XP-farming hole where a user
  // could click "Join Video" without ever clicking "Join Session".
  const handleJoinVideo = useCallback(() => {
    setIsVideoActive(true);
  }, []);

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
    isFocusMode,
    setIsFocusMode,
    handleJoinSession,
    sendMessage,
    togglePinMessage,
    sendTypingEvent,
    handleLeaveVideo,
    handleJoinVideo,
  };
}