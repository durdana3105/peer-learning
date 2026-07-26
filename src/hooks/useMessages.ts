import { useState, useEffect, useMemo, useCallback, useRef, Dispatch, SetStateAction } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAwardXP } from "@/hooks/useAwardXP";
import { toast } from "sonner";
import { logError } from "@/utils/logger";

export type ProfileSummary = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_mentor: boolean;
  is_learner: boolean;
  last_active: string | null;
  last_seen: string | null;
};

export type ProfileRow = ProfileSummary;

export type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url?: string | null;
};

export type MessageRow = {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  content: string | null;
  text: string | null;
  message?: string | null;
  created_at: string | null;
  read_at: string | null;
};

export type ConversationSummary = {
  profile: ProfileSummary;
  lastMessage: MessageRow | null;
  unreadCount: number;
  isOnline: boolean;
};

// Row shape returned by the `get_conversation_summaries` RPC. One row per
// conversation partner, holding only their most recent message + unread
// count — independent of any global message limit.
type RawConversationSummary = {
  other_user_id: string;
  message_id: string;
  sender_id: string | null;
  receiver_id: string | null;
  content: string | null;
  text: string | null;
  message: string | null;
  created_at: string;
  read_at: string | null;
  unread_count: number;
};

export type UseMessagesResult = {
  profiles: ProfileSummary[];
  selectedUser: ProfileSummary | null;
  setSelectedUser: Dispatch<SetStateAction<ProfileSummary | null>>;
  loadingUsers: boolean;
  loadingConversations: boolean;
  loadingThreadMessages: boolean;
  loadingMoreThreadMessages: boolean;
  hasMoreThreadMessages: boolean;
  error: string | null;
  onlineUserIds: string[];
  conversationSummaries: ConversationSummary[];
  threadMessages: MessageRow[];
  selectedConversation: ConversationSummary | null;
  sendMessage: (content: string) => Promise<boolean>;
  loadMoreThreadMessages: () => Promise<void>;
};

const THREAD_PAGE_SIZE = 50;

const normalizeProfile = (row: ProfileRow | UserRow): ProfileSummary => ({
  id: row.id,
  name: row.name,
  email: row.email,
  avatar_url: row.avatar_url ?? null,
  is_mentor: "is_mentor" in row ? row.is_mentor : false,
  is_learner: "is_learner" in row ? row.is_learner : false,
  last_active: "last_active" in row ? row.last_active : null,
  last_seen: "last_seen" in row ? row.last_seen : null,
});

const rawSummaryToMessage = (row: RawConversationSummary): MessageRow => ({
  id: row.message_id,
  sender_id: row.sender_id,
  receiver_id: row.receiver_id,
  content: row.content,
  text: row.text,
  message: row.message,
  created_at: row.created_at,
  read_at: row.read_at,
});

const threadOrFilter = (currentUserId: string, otherUserId: string) =>
  `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`;

/**
 * Custom hook to manage real-time direct messages, online presence, and conversation threads.
 *
 * Conversation summaries (the inbox list) and the open thread's messages are
 * fetched independently:
 *  - `get_conversation_summaries` RPC returns the latest message + unread
 *    count per conversation partner, so a partner's conversation can never
 *    be pushed out by someone else's high message volume.
 *  - The open thread is paginated (`THREAD_PAGE_SIZE` at a time) and loaded
 *    only for the selected conversation.
 *
 * @param {string | null} [currentUserId] - The UUID of the currently authenticated user.
 * @returns {UseMessagesResult} An object containing all conversation state and methods to interact with messages.
 */
export function useMessages(
  currentUserId?: string | null
): UseMessagesResult {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [rawSummaries, setRawSummaries] = useState<RawConversationSummary[]>([]);
  const [threadMessages, setThreadMessages] = useState<MessageRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<ProfileSummary | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingThreadMessages, setLoadingThreadMessages] = useState(false);
  const [loadingMoreThreadMessages, setLoadingMoreThreadMessages] = useState(false);
  const [hasMoreThreadMessages, setHasMoreThreadMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  const awardXP = useAwardXP();

  const selectedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedUserIdRef.current = selectedUser?.id ?? null;
  }, [selectedUser?.id]);

  const profileMap = useMemo(() => {
    return new Map(profiles.map((profile) => [profile.id, profile]));
  }, [profiles]);

  const conversationSummaries = useMemo<ConversationSummary[]>(() => {
    const summaries: ConversationSummary[] = [];

    for (const row of rawSummaries) {
      const profile = profileMap.get(row.other_user_id);
      if (!profile) continue;

      summaries.push({
        profile,
        lastMessage: rawSummaryToMessage(row),
        unreadCount: row.unread_count,
        isOnline: onlineUserIds.includes(row.other_user_id),
      });
    }

    return summaries.sort((left, right) => {
      const leftTime = new Date(left.lastMessage?.created_at ?? 0).getTime();
      const rightTime = new Date(right.lastMessage?.created_at ?? 0).getTime();
      return rightTime - leftTime;
    });
  }, [rawSummaries, profileMap, onlineUserIds]);

  const selectedConversation = useMemo(
    () => conversationSummaries.find((item) => item.profile.id === selectedUser?.id) ?? null,
    [conversationSummaries, selectedUser?.id]
  );

  // Insert or refresh a partner's summary row when a message is sent/received,
  // without needing to re-run the aggregate RPC.
  const upsertRawSummary = useCallback(
    (message: MessageRow, otherUserId: string, incrementUnread: boolean) => {
      setRawSummaries((prev) => {
        const idx = prev.findIndex((r) => r.other_user_id === otherUserId);
        const existing = idx === -1 ? null : prev[idx];
        const nextUnreadCount = incrementUnread ? (existing?.unread_count ?? 0) + 1 : (existing?.unread_count ?? 0);

        const candidateRow: RawConversationSummary = {
          other_user_id: otherUserId,
          message_id: message.id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          content: message.content,
          text: message.text,
          message: message.message ?? null,
          created_at: message.created_at ?? new Date().toISOString(),
          read_at: message.read_at,
          unread_count: nextUnreadCount,
        };

        if (!existing) {
          return [...prev, candidateRow];
        }

        const existingTime = new Date(existing.created_at).getTime();
        const incomingTime = new Date(candidateRow.created_at).getTime();

        const next = [...prev];
        next[idx] =
          incomingTime >= existingTime
            ? candidateRow
            : { ...existing, unread_count: nextUnreadCount };
        return next;
      });
    },
    []
  );

  useEffect(() => {
    if (!currentUserId) {
      setProfiles([]);
      setRawSummaries([]);
      setThreadMessages([]);
      setSelectedUser(null);
      setLoadingUsers(false);
      setLoadingConversations(false);
      setLoadingThreadMessages(false);
      setHasMoreThreadMessages(false);
      setError(null);
      return;
    }

    const getUsers = async () => {
      setLoadingUsers(true);
      setError(null);

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .neq("id", currentUserId)
          .order("name", { ascending: true })
          .limit(100);

        const profiles = (profileData ?? []) as ProfileSummary[];
        setProfiles(profiles);

        if (profileError) {
          throw new Error(profileError.message);
        }
      } catch (err: any) {
        logError(err, { context: "useMessages.getUsers" });
        setError("Failed to load profiles");
        toast.error("Failed to load profiles", {
  description: err.message || "An unexpected error occurred"
});
      } finally {
        setLoadingUsers(false);
      }
    };

    getUsers();
  }, [currentUserId]);

  // Fetch conversation summaries independently of any single-message-list
  // limit — one row per conversation partner, via `get_conversation_summaries`.
  useEffect(() => {
    if (!currentUserId) return;

    let cancelled = false;

    const getConversationSummaries = async () => {
      setLoadingConversations(true);
      setError(null);

      try {
        const { data, error: rpcError } = await (supabase as any).rpc("get_conversation_summaries", {
          p_user_id: currentUserId,
        });

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        if (!cancelled) {
          setRawSummaries((data ?? []) as unknown as RawConversationSummary[]);
        }
      } catch (err: any) {
        if (cancelled) return;
        logError(err, { context: "useMessages.getConversationSummaries" });
        setError("Failed to load conversations");
        toast.error("Failed to load conversations", {
  description: err.message || "An unexpected error occurred"
});
      } finally {
        if (!cancelled) setLoadingConversations(false);
      }
    };

    getConversationSummaries();

    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  // Set up real-time listener for profile updates.
  // This ensures the UI reflects name/avatar changes immediately across all clients.
  useEffect(() => {
    if (!currentUserId) return;

    const profilesChannel = supabase
      .channel("messages-profiles-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          const newRow = payload.new as Partial<ProfileRow>;
          if (newRow && newRow.id && newRow.id !== currentUserId) {
            setProfiles((prev) => {
              const updated = normalizeProfile(payload.new as ProfileRow);
              const index = prev.findIndex((p) => p.id === updated.id);

              if (index === -1) {
                const newProfiles = [...prev, updated];
                newProfiles.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                return newProfiles;
              }

              const newProfiles = [...prev];
              newProfiles[index] = { ...newProfiles[index], ...updated };
              return newProfiles;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, [currentUserId]);

  // Load initial thread messages when selectedUser changes
  useEffect(() => {
    if (!currentUserId || !selectedUser?.id) {
      setThreadMessages([]);
      setHasMoreThreadMessages(false);
      return;
    }

    let cancelled = false;

    const loadInitialThread = async () => {
      setLoadingThreadMessages(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from("messages")
          .select("id,sender_id,receiver_id,content,text,message,created_at,read_at")
          .or(threadOrFilter(currentUserId, selectedUser.id))
          .order("created_at", { ascending: false })
          .limit(THREAD_PAGE_SIZE);

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (!cancelled) {
          const typedMessages = (data ?? []) as MessageRow[];
          setThreadMessages(typedMessages.reverse());
          setHasMoreThreadMessages(typedMessages.length === THREAD_PAGE_SIZE);
        }
      } catch (err: any) {
        if (cancelled) return;
        logError(err, { context: "useMessages.loadInitialThread" });
        setError("Failed to load messages");
        toast.error("Failed to load messages", {
  description: err.message || "An unexpected error occurred"
});
      } finally {
        if (!cancelled) {
          setLoadingThreadMessages(false);
        }
      }
    };

    loadInitialThread();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, selectedUser?.id]);

  const loadMoreThreadMessages = useCallback(async () => {
    if (!currentUserId || !selectedUser?.id || loadingMoreThreadMessages || !hasMoreThreadMessages || threadMessages.length === 0) {
      return;
    }

    setLoadingMoreThreadMessages(true);
    const oldestTimestamp = threadMessages[0].created_at;

    try {
      const { data, error: queryError } = await supabase
        .from("messages")
        .select("id,sender_id,receiver_id,content,text,message,created_at,read_at")
        .or(threadOrFilter(currentUserId, selectedUser.id))
        .lt("created_at", oldestTimestamp)
        .order("created_at", { ascending: false })
        .limit(THREAD_PAGE_SIZE);

      if (queryError) {
        throw new Error(queryError.message);
      }

      if (data) {
        const typedMessages = (data ?? []) as MessageRow[];
        setThreadMessages((prev) => [...typedMessages.reverse(), ...prev]);
        setHasMoreThreadMessages(typedMessages.length === THREAD_PAGE_SIZE);
      }
    } catch (err: any) {
      logError(err, { context: "useMessages.loadMoreThreadMessages" });
      toast.error("Failed to load earlier messages", {
  description: err.message || "An unexpected error occurred"
});
    } finally {
      setLoadingMoreThreadMessages(false);
    }
  }, [currentUserId, selectedUser?.id, loadingMoreThreadMessages, hasMoreThreadMessages, threadMessages]);

  // Manage online presence using Supabase Presence.
  // This tracks which users are currently viewing the app and listens for incoming real-time messages.
  useEffect(() => {
    if (!currentUserId) return;

    const presenceChannel = supabase.channel("messages-online-presence", {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        setOnlineUserIds(Object.keys(presenceChannel.presenceState()));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    const channel = supabase
      .channel("messages-inbox-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const nextMessage = payload.new as MessageRow;

          if (
            nextMessage.sender_id !== currentUserId &&
            nextMessage.receiver_id !== currentUserId
          ) {
            return;
          }

          const otherUserId =
            nextMessage.sender_id === currentUserId
              ? nextMessage.receiver_id
              : nextMessage.sender_id;

          if (otherUserId) {
            const isCurrentThread = selectedUserIdRef.current === otherUserId;
            upsertRawSummary(nextMessage, otherUserId, !isCurrentThread && nextMessage.sender_id !== currentUserId);

            if (isCurrentThread) {
              setThreadMessages((prev) => {
                if (prev.some((m) => m.id === nextMessage.id)) {
                  return prev;
                }
                return [...prev, nextMessage];
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(channel);
    };
  }, [currentUserId, upsertRawSummary]);

  useEffect(() => {
    if (!currentUserId || !selectedUser?.id || threadMessages.length === 0) return;

    const unreadIds = threadMessages
      .filter((message) => message.receiver_id === currentUserId && !message.read_at)
      .map((message) => message.id);

    if (unreadIds.length === 0) return;

    const markAsRead = async () => {
      try {
        const { error: rpcError } = await supabase.rpc("mark_messages_as_read", {
          message_ids: unreadIds,
        });

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        setThreadMessages((previous) =>
          previous.map((message) =>
            unreadIds.includes(message.id)
              ? { ...message, read_at: message.read_at ?? new Date().toISOString() }
              : message
          )
        );

        setRawSummaries((prev) =>
          prev.map((r) =>
            r.other_user_id === selectedUser.id
              ? { ...r, unread_count: 0 }
              : r
          )
        );
      } catch (err: any) {
        logError(err, { context: "useMessages.markAsRead" });
        toast.error("Failed to mark messages as read", {
  description: err.message || "An unexpected error occurred"
});
      }
    };

    void markAsRead();
  }, [currentUserId, selectedUser?.id, threadMessages]);

  useEffect(() => {
    if (selectedUser) return;

    const firstConversation = conversationSummaries[0]?.profile ?? null;
    if (firstConversation) {
      setSelectedUser(firstConversation);
    }
  }, [conversationSummaries, selectedUser]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content || !selectedUser || !currentUserId) return false;

    if (content.length > 1000) {
      toast.error("Message too long", {
  description: "Message exceeds the 1000 character limit."
});
      return false;
    }

    try {
      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: selectedUser.id,
          content,
          text: content,
        })
        .select("id,sender_id,receiver_id,content,text,message,created_at,read_at")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (data) {
        const nextMessage = data as MessageRow;
        setThreadMessages((prev) => {
          if (prev.some((m) => m.id === nextMessage.id)) {
            return prev;
          }
          return [...prev, nextMessage];
        });

        upsertRawSummary(nextMessage, selectedUser.id, false);
        awardXP.mutate({ activity: "chat_message" });
      }
      return true;
    } catch (err: any) {
      logError(err, { context: "useMessages.sendMessage" });
      toast.error("Failed to send message", {
  description: err.message || "An unexpected error occurred"
});
      return false;
    }
  }, [currentUserId, selectedUser, awardXP, upsertRawSummary]);

  return {
    profiles,
    selectedUser,
    setSelectedUser,
    loadingUsers,
    loadingConversations,
    loadingThreadMessages,
    loadingMoreThreadMessages,
    hasMoreThreadMessages,
    error,
    onlineUserIds,
    conversationSummaries,
    threadMessages,
    selectedConversation,
    sendMessage,
    loadMoreThreadMessages,
  };
}