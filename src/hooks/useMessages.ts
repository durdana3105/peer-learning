import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAwardXP } from "@/hooks/useAwardXP";

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

const mergeProfiles = (profiles: ProfileSummary[], users: UserRow[]) => {
  const map = new Map<string, ProfileSummary>();

  for (const user of users) {
    map.set(user.id, normalizeProfile(user));
  }

  for (const profile of profiles) {
    map.set(profile.id, profile);
  }

  return Array.from(map.values());
};

const isThreadMessage = (message: MessageRow, currentUserId: string, otherUserId: string) => {
  return (
    (message.sender_id === currentUserId && message.receiver_id === otherUserId) ||
    (message.sender_id === otherUserId && message.receiver_id === currentUserId)
  );
};

export function useMessages(currentUserId?: string | null) {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<ProfileSummary | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  const awardXP = useAwardXP();

  const profileMap = useMemo(() => {
    return new Map(profiles.map((profile) => [profile.id, profile]));
  }, [profiles]);

  const conversationSummaries = useMemo<ConversationSummary[]>(() => {
    if (!currentUserId) return [];

    const summaries = new Map<string, ConversationSummary>();

    for (const message of messages) {
      const otherUserId =
        message.sender_id === currentUserId
          ? message.receiver_id
          : message.receiver_id === currentUserId
            ? message.sender_id
            : null;

      if (!otherUserId) continue;

      const profile = profileMap.get(otherUserId);
      if (!profile) continue;

      const existing = summaries.get(otherUserId) ?? {
        profile,
        lastMessage: null,
        unreadCount: 0,
        isOnline: onlineUserIds.includes(otherUserId),
      };

      if (message.receiver_id === currentUserId && !message.read_at) {
        existing.unreadCount += 1;
      }

      if (
        !existing.lastMessage ||
        new Date(message.created_at ?? 0).getTime() >
          new Date(existing.lastMessage.created_at ?? 0).getTime()
      ) {
        existing.lastMessage = message;
      }

      existing.isOnline = onlineUserIds.includes(otherUserId);
      summaries.set(otherUserId, existing);
    }

    return Array.from(summaries.values()).sort((left, right) => {
      const leftTime = new Date(left.lastMessage?.created_at ?? 0).getTime();
      const rightTime = new Date(right.lastMessage?.created_at ?? 0).getTime();
      return rightTime - leftTime;
    });
  }, [currentUserId, messages, onlineUserIds, profileMap]);

  const threadMessages = useMemo(() => {
    if (!currentUserId || !selectedUser?.id) return [];

    return messages.filter((message) => isThreadMessage(message, currentUserId, selectedUser.id));
  }, [currentUserId, messages, selectedUser?.id]);

  const selectedConversation = useMemo(
    () => conversationSummaries.find((item) => item.profile.id === selectedUser?.id) ?? null,
    [conversationSummaries, selectedUser?.id]
  );

  useEffect(() => {
    if (!currentUserId) {
      setProfiles([]);
      setMessages([]);
      setSelectedUser(null);
      setLoadingUsers(false);
      setLoadingMessages(false);
      return;
    }

    const getUsers = async () => {
      setLoadingUsers(true);

      const [{ data: profileData, error: profileError }, { data: userData, error: userError }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .neq("id", currentUserId)
            .order("name", { ascending: true })
            .limit(100),
          supabase
            .from("profiles")
            .select("*")
            .neq("id", currentUserId)
            .order("name", { ascending: true })
            .limit(100),
        ]);

      const mergedUsers = mergeProfiles(
        (profileData ?? []).map((row) => row as ProfileSummary),
        (userData ?? []) as UserRow[]
      );

      if (mergedUsers.length > 0) {
        setProfiles(mergedUsers);
      } else {
        setProfiles([]);
      }

      if (profileError && !userData?.length) {
        console.error("Failed to load profiles:", profileError.message);
      }

      if (userError && !profileData?.length) {
        console.error("Failed to load users:", userError.message);
      }

      setLoadingUsers(false);
    };

    getUsers();
  }, [currentUserId]);

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
        (payload: any) => {
          if (payload.new && payload.new.id && payload.new.id !== currentUserId) {
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

  useEffect(() => {
    if (!currentUserId) return;

    const loadMessages = async () => {
      setLoadingMessages(true);

      const { data, error } = await supabase
        .from("messages")
        .select("id,sender_id,receiver_id,content,text,message,created_at,read_at")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        setMessages([...(data as any[])].reverse());
      } else if (error) {
        console.error("Failed to load messages:", error.message);
      }

      setLoadingMessages(false);
    };

    loadMessages();
  }, [currentUserId]);

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

          setMessages((previous) => {
            if (previous.some((message) => message.id === nextMessage.id)) {
              return previous;
            }

            return [...previous, nextMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || !selectedUser?.id || threadMessages.length === 0) return;

    const unreadIds = threadMessages
      .filter((message) => message.receiver_id === currentUserId && !message.read_at)
      .map((message) => message.id);

    if (unreadIds.length === 0) return;

    const markAsRead = async () => {
      const { error } = await (supabase as any).rpc("mark_messages_as_read", {
        message_ids: unreadIds,
      });

      if (error) {
        console.error("Failed to mark messages as read:", error.message);
        return;
      }

      setMessages((previous) =>
        previous.map((message) =>
          unreadIds.includes(message.id)
            ? { ...message, read_at: message.read_at ?? new Date().toISOString() }
            : message
        )
      );
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
      console.error("Message exceeds the 1000 character limit.");
      return false;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUserId,
        receiver_id: selectedUser.id,
        content,
        text: content,
      })
      .select("id,sender_id,receiver_id,content,text,message,created_at,read_at")
      .single();

    if (error) {
      console.error("Failed to send message:", error.message);
      return false;
    }

    if (data) {
      const newMessage = data as unknown as MessageRow;
      setMessages((previous) =>
        previous.some((message) => message.id === newMessage.id)
          ? previous
          : [...previous, newMessage]
      );
      awardXP.mutate({ activity: "chat_message" });
    }
    return true;
  }, [currentUserId, selectedUser, awardXP]);

  return {
    profiles,
    messages,
    selectedUser,
    setSelectedUser,
    loadingUsers,
    loadingMessages,
    onlineUserIds,
    conversationSummaries,
    threadMessages,
    selectedConversation,
    sendMessage,
  };
}
