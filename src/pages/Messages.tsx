import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Inbox, MessageCircle, Phone, Search, Send, Users, Video } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { supabase } from "@/integrations/supabase/client";
import { useAwardXP } from "@/hooks/useAwardXP";

type ProfileSummary = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_mentor: boolean;
  is_learner: boolean;
  last_active: string | null;
  last_seen: string | null;
};

type ProfileRow = ProfileSummary;

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url?: string | null;
};

type MessageRow = {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  content: string | null;
  text: string | null;
  message?: string | null;
  created_at: string | null;
  read_at: string | null;
};

type ConversationSummary = {
  profile: ProfileSummary;
  lastMessage: MessageRow | null;
  unreadCount: number;
  isOnline: boolean;
};

const getDisplayName = (profile?: Pick<ProfileSummary, "name" | "email"> | null) =>
  profile?.name?.trim() || profile?.email?.split("@")[0] || "Learner";

const getInitial = (profile?: Pick<ProfileSummary, "name" | "email"> | null) =>
  getDisplayName(profile).charAt(0).toUpperCase();

const getMessageBody = (message: MessageRow) =>
  message.content || message.text || message.message || "";

const getRoleLabel = (profile: ProfileSummary) => {
  if (profile.is_mentor && profile.is_learner) return "Mentor + Learner";
  if (profile.is_mentor) return "Mentor";
  if (profile.is_learner) return "Learner";
  return "Peer";
};

const normalizeProfile = (
  row: ProfileRow | UserRow
): ProfileSummary => ({
  id: row.id,
  name: row.name,
  email: row.email,
  avatar_url: row.avatar_url ?? null,
  is_mentor: "is_mentor" in row ? row.is_mentor : false,
  is_learner: "is_learner" in row ? row.is_learner : false,
  last_active: "last_active" in row ? row.last_active : null,
  last_seen: "last_seen" in row ? row.last_seen : null,
});

type ConversationRowProps = {
  profile: ProfileSummary;
  lastMessage: MessageRow | null;
  unreadCount: number;
  isOnline: boolean;
  isSelected: boolean;
  onSelect: (profile: ProfileSummary) => void;
};

const ConversationRow = memo(({ profile, lastMessage, unreadCount, isOnline, isSelected, onSelect }: ConversationRowProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(profile)}
      className={`flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition-all duration-300 ${
        isSelected
          ? "border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.12)]"
          : "border-white/5 bg-white/5 hover:border-cyan-500/20 hover:bg-white/10"
      }`}
    >
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-black">
        {getInitial(profile)}
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950 ${
            isOnline ? "bg-emerald-400" : "bg-slate-500"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{getDisplayName(profile)}</p>
            <p className="truncate text-xs text-slate-400">{getRoleLabel(profile)}</p>
          </div>

          {lastMessage?.created_at && (
            <span className="shrink-0 text-[11px] text-slate-500">{formatTime(lastMessage.created_at)}</span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="truncate text-sm text-slate-300">
            {lastMessage ? getMessageBody(lastMessage) : "Start the conversation"}
          </p>

          {unreadCount > 0 && (
            <span className="shrink-0 rounded-full bg-cyan-400 px-2.5 py-1 text-[11px] font-semibold text-slate-950">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

type ThreadBubbleProps = {
  message: MessageRow;
  isMine: boolean;
  timeLabel: string;
  isRead: boolean;
};

const ThreadBubble = memo(
  forwardRef<HTMLDivElement, ThreadBubbleProps>(function ThreadBubble(
    { message, isMine, timeLabel, isRead },
    ref
  ) {
    const body = getMessageBody(message);

    return (
      <div ref={ref} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[82%] rounded-3xl px-4 py-3 shadow-xl shadow-black/10 sm:max-w-[70%] ${
            isMine
              ? "rounded-br-md bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950"
              : "rounded-bl-md border border-white/10 bg-white/10 text-white backdrop-blur-xl"
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-6">{body}</p>
          <div className={`mt-2 flex items-center justify-between gap-3 text-[11px] ${isMine ? "text-slate-900/70" : "text-slate-400"}`}>
            <span>{timeLabel}</span>
            {isMine && isRead && <span>Read</span>}
          </div>
        </div>
      </div>
    );
  })
);

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

const formatTime = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRelativeTime = (value: string | null) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMinutes = Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const isThreadMessage = (message: MessageRow, currentUserId: string, otherUserId: string) => {
  return (
    (message.sender_id === currentUserId && message.receiver_id === otherUserId) ||
    (message.sender_id === otherUserId && message.receiver_id === currentUserId)
  );
};

type MessagesProps = {
  user?: {
    id?: string | null;
  } | null;
};

const Messages = ({ user }: MessagesProps) => {
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<ProfileSummary | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);
  
  const awardXP = useAwardXP();

  const currentUserId = user?.id;

  const conversationListRef = useRef<HTMLDivElement | null>(null);
  const threadMessagesRef = useRef<HTMLDivElement | null>(null);

  const conversationVirtualizer = useVirtualizer({
    count: filteredConversationSummaries.length,
    getScrollElement: () => conversationListRef.current,
    estimateSize: () => 96,
    overscan: 8,
  });

  const threadVirtualizer = useVirtualizer({
    count: threadMessages.length,
    getScrollElement: () => threadMessagesRef.current,
    estimateSize: () => 92,
    overscan: 12,
  });

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

  const filteredConversationSummaries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return conversationSummaries;

    return conversationSummaries.filter(({ profile, lastMessage }) => {
      const haystack = [
        getDisplayName(profile),
        profile.email ?? "",
        getRoleLabel(profile),
        lastMessage ? getMessageBody(lastMessage) : "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [conversationSummaries, search]);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      if (profile.id === currentUserId) return false;

      if (!query) return true;

      const haystack = [getDisplayName(profile), profile.email ?? "", getRoleLabel(profile)]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [currentUserId, profiles, search]);

  const threadMessages = useMemo(() => {
    if (!currentUserId || !selectedUser?.id) return [];

    return messages.filter((message) => isThreadMessage(message, currentUserId, selectedUser.id));
  }, [currentUserId, messages, selectedUser?.id]);

  const selectedConversation = useMemo(
    () => conversationSummaries.find((item) => item.profile.id === selectedUser?.id) ?? null,
    [conversationSummaries, selectedUser?.id]
  );

  useEffect(() => {
    if (threadMessages.length > 0) {
      threadVirtualizer.scrollToIndex(threadMessages.length - 1, { align: "end" });
    }
  }, [threadMessages.length, threadVirtualizer]);

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
            .from("users")
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
        (payload) => {
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
        setMessages((data as MessageRow[]).reverse());
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
      const { error } = await supabase.rpc("mark_messages_as_read", {
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

  const sendMessage = useCallback(async () => {
    const content = newMessage.trim();

    if (!content || !selectedUser || !currentUserId) return;

    if (content.length > 2000) {
      console.error("Message exceeds the 2000 character limit.");
      return;
    }

    setNewMessage("");

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
      setNewMessage(content);
      console.error("Failed to send message:", error.message);
      return;
    }

    if (data) {
      setMessages((previous) =>
        previous.some((message) => message.id === data.id)
          ? previous
          : [...previous, data as MessageRow]
      );
      awardXP.mutate({ activity: "chat_message" });
    }
  }, [currentUserId, newMessage, selectedUser, awardXP]);

  const selectProfile = useCallback((profile: ProfileSummary) => {
    setSelectedUser(profile);
    setShowSidebarOnMobile(false);
  }, []);

  const selectedDisplayName = selectedUser ? getDisplayName(selectedUser) : "Messages";
  const selectedSubtitle = selectedUser
    ? `${getRoleLabel(selectedUser)} • ${
        selectedConversation?.isOnline
          ? "Online now"
          : formatRelativeTime(selectedUser.last_active || selectedUser.last_seen) || "Offline"
      }`
    : "Pick a conversation or start a new one.";

  const hasNoConversations = !loadingUsers && conversationSummaries.length === 0;

  if (!currentUserId) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#020617] px-4 text-white">
        <div className="max-w-md text-center">
          <MessageCircle className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
          <h1 className="text-2xl font-semibold">Sign in to view messages</h1>
          <p className="mt-2 text-sm text-slate-400">
            Real-time conversations are available after login.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-[#020617] via-[#020B1F] to-[#050014] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.12),transparent)]" />
      <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[340px] w-[340px] rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex h-[calc(100vh-4rem)] max-w-7xl overflow-hidden border-x border-white/10 bg-white/5 backdrop-blur-2xl">
        <aside
          className={`${showSidebarOnMobile ? "flex" : "hidden"} w-full flex-col border-r border-white/10 bg-slate-950/80 md:flex md:w-[380px]`}
        >
          <div className="border-b border-white/10 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Messages</p>
                <h1 className="mt-2 text-2xl font-semibold text-white">Inbox</h1>
                <p className="mt-2 text-sm text-slate-400">
                  Conversations with mentors, learners, and peers.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-300">
                <Inbox className="h-5 w-5" />
              </div>
            </div>

            <label className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 shadow-inner shadow-black/10">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations or people"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </label>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Conversations</h2>
                <span className="text-xs text-slate-500">{conversationSummaries.length}</span>
              </div>

              {loadingUsers || loadingMessages ? (
                <div className="space-y-3">
                  <div className="h-20 animate-pulse rounded-3xl bg-white/5" />
                  <div className="h-20 animate-pulse rounded-3xl bg-white/5" />
                  <div className="h-20 animate-pulse rounded-3xl bg-white/5" />
                </div>
              ) : filteredConversationSummaries.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                  {search.trim()
                    ? "No conversations match your search."
                    : "No conversations yet. Start a new one from the people list."}
                </div>
              ) : (
                <div ref={conversationListRef} className="h-[420px] overflow-y-auto pr-1">
                  <div style={{ height: `${conversationVirtualizer.getTotalSize()}px`, position: "relative" }}>
                    {conversationVirtualizer.getVirtualItems().map((virtualItem) => {
                      const item = filteredConversationSummaries[virtualItem.index];

                      return (
                        <div
                          key={item.profile.id}
                          data-index={virtualItem.index}
                          ref={conversationVirtualizer.measureElement}
                          style={{
                            transform: `translateY(${virtualItem.start}px)`,
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                          }}
                          className="pb-2"
                        >
                          <ConversationRow
                            profile={item.profile}
                            lastMessage={item.lastMessage}
                            unreadCount={item.unreadCount}
                            isOnline={item.isOnline}
                            isSelected={selectedUser?.id === item.profile.id}
                            onSelect={selectProfile}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">People</h2>
                <span className="text-xs text-slate-500">{filteredProfiles.length}</span>
              </div>

              {loadingUsers ? (
                <div className="space-y-3">
                  <div className="h-16 animate-pulse rounded-3xl bg-white/5" />
                  <div className="h-16 animate-pulse rounded-3xl bg-white/5" />
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                  No people match your search.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProfiles.map((profile) => {
                    const isSelected = selectedUser?.id === profile.id;
                    const isOnline = onlineUserIds.includes(profile.id);

                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => selectProfile(profile)}
                        className={`flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition-all duration-300 ${
                          isSelected
                            ? "border-cyan-400/60 bg-cyan-500/10"
                            : "border-white/5 bg-white/5 hover:border-cyan-500/20 hover:bg-white/10"
                        }`}
                      >
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 font-semibold text-slate-950">
                          {getInitial(profile)}
                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950 ${
                              isOnline ? "bg-emerald-400" : "bg-slate-500"
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">{getDisplayName(profile)}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <span>{getRoleLabel(profile)}</span>
                            <span>•</span>
                            <span>{isOnline ? "Online" : formatRelativeTime(profile.last_active || profile.last_seen) || "Offline"}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </aside>

        <section className={`${showSidebarOnMobile ? "hidden" : "flex"} min-w-0 flex-1 flex-col bg-slate-950 md:flex`}>
          {selectedUser ? (
            <>
              <header className="flex h-20 items-center justify-between border-b border-white/10 bg-white/5 px-4 backdrop-blur-2xl sm:px-6">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setShowSidebarOnMobile(true)}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 md:hidden"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>

                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-black sm:h-12 sm:w-12">
                    {getInitial(selectedUser)}
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950 ${
                        selectedConversation?.isOnline ? "bg-emerald-400" : "bg-slate-500"
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-white sm:text-lg">{selectedDisplayName}</h2>
                    <p className="truncate text-xs text-cyan-300 sm:text-sm">{selectedSubtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    className="hidden rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10 sm:inline-flex"
                    aria-label="Start a voice call"
                  >
                    <Phone className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    className="hidden rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10 sm:inline-flex"
                    aria-label="Start a video call"
                  >
                    <Video className="h-4 w-4" />
                  </button>
                </div>
              </header>

              <div ref={threadMessagesRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                {loadingMessages ? (
                  <div className="space-y-4">
                    <div className="h-14 w-56 animate-pulse rounded-3xl bg-white/10" />
                    <div className="ml-auto h-14 w-64 animate-pulse rounded-3xl bg-cyan-400/20" />
                    <div className="h-14 w-48 animate-pulse rounded-3xl bg-white/10" />
                  </div>
                ) : threadMessages.length === 0 ? (
                  <div className="flex min-h-[320px] items-center justify-center px-4 text-center">
                    <div className="max-w-md rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                      <MessageCircle className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
                      <h3 className="text-xl font-semibold text-white">Start chatting with {selectedDisplayName}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Messages you send here will persist, sync in real time, and show up in the inbox.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ height: `${threadVirtualizer.getTotalSize()}px`, position: "relative" }}>
                    {threadVirtualizer.getVirtualItems().map((virtualItem) => {
                      const message = threadMessages[virtualItem.index];
                      const isMine = message.sender_id === currentUserId;

                      return (
                        <div
                          key={message.id}
                          data-index={virtualItem.index}
                          ref={threadVirtualizer.measureElement}
                          style={{
                            transform: `translateY(${virtualItem.start}px)`,
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                          }}
                          className="pb-4"
                        >
                          <ThreadBubble
                            message={message}
                            isMine={isMine}
                            timeLabel={formatTime(message.created_at)}
                            isRead={Boolean(message.read_at)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 bg-white/5 p-4 backdrop-blur-2xl sm:p-5">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/10">
                  <textarea
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder={`Message ${selectedDisplayName}...`}
                    className="min-h-[72px] w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-slate-500"
                    maxLength={2000}
                  />

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">Press Enter to send, Shift+Enter for a new line.</p>

                    <button
                      type="button"
                      onClick={() => void sendMessage()}
                      disabled={!newMessage.trim()}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-4 text-center">
              <div className="max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950">
                  <Users className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">Choose a conversation</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Search for a mentor, learner, or peer on the left to start a secure, persistent conversation.
                </p>

                <button
                  type="button"
                  onClick={() => setShowSidebarOnMobile(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-200 md:hidden"
                >
                  <Inbox className="h-4 w-4" />
                  Open inbox
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {hasNoConversations && (
        <div className="pointer-events-none absolute bottom-4 left-4 hidden max-w-sm rounded-2xl border border-cyan-400/20 bg-slate-950/80 px-4 py-3 text-sm text-slate-300 shadow-2xl shadow-black/30 backdrop-blur-xl lg:block">
          Start with People on the left to create your first conversation.
        </div>
      )}
    </main>
  );
};

export default Messages;
