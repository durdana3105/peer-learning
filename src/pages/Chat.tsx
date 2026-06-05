import React, { memo, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Search, Send } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

import { AuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAwardXP } from "@/hooks/useAwardXP";
const MarkdownRenderer = React.lazy(() =>
  import("@/components/MarkdownRenderer").then((module) => ({ default: module.MarkdownRenderer }))
);

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url?: string | null;
};

type UserRow = Profile;

const mergeUsers = (profiles: Profile[], users: UserRow[]) => {
  const map = new Map<string, Profile>();

  for (const user of users) {
    map.set(user.id, user);
  }

  for (const profile of profiles) {
    map.set(profile.id, profile);
  }

  return Array.from(map.values());
};

type ChatMessage = {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  content: string | null;
  text?: string | null;
  created_at: string | null;
  read_at?: string | null;
};

type ConversationRowProps = {
  user: Profile;
  isOnline: boolean;
  isSelected: boolean;
  onSelect: (user: Profile) => void;
};

const ConversationRow = memo(({ user, isOnline, isSelected, onSelect }: ConversationRowProps) => {
  return (
    <button
      onClick={() => onSelect(user)}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
        isSelected
          ? "border-cyan-400/60 bg-cyan-400/10"
          : "border-transparent hover:border-white/10 hover:bg-white/5"
      }`}
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-sm font-semibold text-slate-950">
        {getInitial(user)}
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 ${
            isOnline ? "bg-emerald-400" : "bg-slate-500"
          }`}
        />
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">{getDisplayName(user)}</p>
        <p className={isOnline ? "text-xs text-emerald-300" : "text-xs text-slate-500"}>
          {isOnline ? "Online" : "Offline"}
        </p>
      </div>
    </button>
  );
});

type ChatBubbleProps = {
  message: ChatMessage;
  isMine: boolean;
  timeLabel: string;
  markdownRenderer: React.ComponentType<{ content: string; className?: string }>;
};

const ChatBubble = memo(
  React.forwardRef<HTMLDivElement, ChatBubbleProps>(function ChatBubble(
    { message, isMine, timeLabel, markdownRenderer: Markdown },
    ref
  ) {
    const body = message.content || message.text || "";

    return (
      <div ref={ref} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm md:max-w-[68%] ${
            isMine
              ? "rounded-br-md bg-cyan-400 text-slate-950"
              : "rounded-bl-md border border-white/10 bg-white/10 text-white"
          }`}
        >
          <Suspense fallback={<p className="whitespace-pre-wrap break-words text-sm leading-6">{body}</p>}>
            <Markdown content={body} className="whitespace-pre-wrap break-words text-sm leading-6" />
          </Suspense>
          <p className={`mt-1 text-[11px] ${isMine ? "text-slate-700" : "text-slate-400"}`}>
            {timeLabel}
          </p>
        </div>
      </div>
    );
  })
);

const getDisplayName = (profile?: Profile | null) =>
  profile?.name || profile?.email?.split("@")[0] || "Learner";

const getInitial = (profile?: Profile | null) =>
  getDisplayName(profile).charAt(0).toUpperCase();

const Chat = () => {
  const auth = useContext(AuthContext);
  const currentUser = auth?.user;

  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const awardXP = useAwardXP();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationsParentRef = useRef<HTMLDivElement | null>(null);
  const messagesParentRef = useRef<HTMLDivElement | null>(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      `${user.name ?? ""} ${user.email ?? ""}`.toLowerCase().includes(query)
    );
  }, [search, users]);

  const conversationVirtualizer = useVirtualizer({
    count: filteredUsers.length,
    getScrollElement: () => conversationsParentRef.current,
    estimateSize: () => 88,
    overscan: 8,
  });

  const messageVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => messagesParentRef.current,
    estimateSize: () => 88,
    overscan: 12,
  });

  useEffect(() => {
    if (messages.length > 0) {
      messageVirtualizer.scrollToIndex(messages.length - 1, { align: "end" });
    }
  }, [messages.length, messageVirtualizer]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const loadUsers = async () => {
      setLoadingUsers(true);

      const [{ data: profileData }, { data: userData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .neq("id", currentUser.id)
          .order("name", { ascending: true })
          .limit(100),
        supabase
          .from("users")
          .select("*")
          .neq("id", currentUser.id)
          .order("name", { ascending: true })
          .limit(100),
      ]);

      const mergedUsers = mergeUsers(
        (profileData ?? []) as Profile[],
        (userData ?? []) as UserRow[]
      );

      setUsers(mergedUsers);
      setSelectedUser((current) => current ?? mergedUsers[0] ?? null);

      setLoadingUsers(false);
    };

    loadUsers();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const profilesChannel = supabase
      .channel("chat-profiles-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setUsers((prev) => prev.filter((u) => u.id !== payload.old.id));
            return;
          }

          const updatedProfile = payload.new as Profile;
          if (updatedProfile.id === currentUser.id) return;

          setUsers((prev) => {
            const index = prev.findIndex((u) => u.id === updatedProfile.id);
            if (index !== -1) {
              const newUsers = [...prev];
              newUsers[index] = { ...newUsers[index], ...updatedProfile };
              return newUsers.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            } else {
              const newUsers = [...prev, updatedProfile];
              return newUsers.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const presenceChannel = supabase.channel("chat-online-users", {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        setOnlineUsers(Object.keys(presenceChannel.presenceState()));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: currentUser.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || !selectedUser?.id) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);

      const { data, error } = await supabase
        .from("messages")
        .select("id,sender_id,receiver_id,content,text,created_at")
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`
        )
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data as ChatMessage[]);
      }

      setLoadingMessages(false);
    };

    loadMessages();

    const handleNewMessage = (payload: RealtimePostgresInsertPayload<ChatMessage>) => {
      const nextMessage = payload.new as ChatMessage;
      const belongsToOpenChat =
        (nextMessage.sender_id === currentUser.id &&
          nextMessage.receiver_id === selectedUser.id) ||
        (nextMessage.sender_id === selectedUser.id &&
          nextMessage.receiver_id === currentUser.id);

      if (!belongsToOpenChat) return;

      setMessages((previous) => {
        if (previous.some((message) => message.id === nextMessage.id)) {
          return previous;
        }

        return [...previous, nextMessage];
      });
    };

    const messageChannel = supabase
      .channel(`chat-messages-${currentUser.id}-${selectedUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        handleNewMessage
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${currentUser.id}`,
        },
        handleNewMessage
      )
      .subscribe();

    let lastTypingUpdate = 0;

    const typingChannel = supabase
      .channel(`chat-typing-${[currentUser.id, selectedUser.id].sort().join("-")}`, {
        config: { private: true },
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const now = Date.now();
        if (now - lastTypingUpdate < 300) return; // Drop excessive messages to prevent DoS
        lastTypingUpdate = now;

        if (payload.senderId !== selectedUser.id) return;

        setTypingUserId(payload.isTyping ? payload.senderId : null);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        if (payload.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUserId(null);
          }, 1800);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(typingChannel);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentUser?.id, selectedUser?.id]);

  const sendTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!currentUser?.id || !selectedUser?.id) return;

    await supabase
      .channel(`chat-typing-${[currentUser.id, selectedUser.id].sort().join("-")}`, {
        config: { private: true },
      })
      .send({
        type: "broadcast",
        event: "typing",
        payload: {
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          isTyping,
        },
      });
  }, [currentUser?.id, selectedUser?.id]);

  const handleMessageChange = useCallback((value: string) => {
    setMessageText(value);
    sendTypingStatus(Boolean(value.trim()));

    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }

    stopTypingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 1200);
  }, [sendTypingStatus]);

  const sendMessage = useCallback(async () => {
    const content = messageText.trim();

    if (!content || !currentUser?.id || !selectedUser?.id) return;

    if (content.length > 2000) {
      alert("Message exceeds maximum length of 2000 characters.");
      return;
    }

    setMessageText("");
    await sendTypingStatus(false);

    const { error } = await supabase.from("messages").insert({
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content,
      text: content,
    });

    if (error) {
      setMessageText(content);
      console.error("Failed to send message:", error.message);
    } else {
      awardXP.mutate({ activity: "chat_message" });
    }
  }, [currentUser?.id, messageText, selectedUser?.id, sendTypingStatus, awardXP]);

  const selectUser = useCallback((user: Profile) => {
    setSelectedUser(user);
    setShowConversationList(false);
    setTypingUserId(null);
  }, []);

  if (!currentUser) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-md text-center">
          <MessageCircle className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
          <h1 className="text-2xl font-semibold">Sign in to open chat</h1>
          <p className="mt-2 text-sm text-slate-400">
            Real-time conversations are available after login.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white">
      <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl overflow-hidden border-x border-white/10 bg-slate-950">
        <aside
          className={`${
            showConversationList ? "flex" : "hidden"
          } w-full flex-col border-r border-white/10 bg-slate-900/80 md:flex md:w-80`}
        >
          <div className="border-b border-white/10 p-4">
            <h1 className="text-xl font-semibold">Chat</h1>
            <p className="mt-1 text-sm text-slate-400">
              Doubts, mentoring, and peer learning in real time.
            </p>

            <label className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search learners"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </label>
          </div>

          <div ref={conversationsParentRef} className="flex-1 overflow-y-auto p-3">
            {loadingUsers ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-xl bg-white/10" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-xl border border-white/10 p-4 text-sm text-slate-400">
                No learners found.
              </div>
            ) : (
              <div style={{ height: `${conversationVirtualizer.getTotalSize()}px`, position: "relative" }}>
                {conversationVirtualizer.getVirtualItems().map((virtualItem) => {
                  const user = filteredUsers[virtualItem.index];

                  return (
                    <div
                      key={user.id}
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
                        user={user}
                        isOnline={onlineUsers.includes(user.id)}
                        isSelected={selectedUser?.id === user.id}
                        onSelect={selectUser}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section
          className={`${
            showConversationList ? "hidden" : "flex"
          } min-w-0 flex-1 flex-col bg-slate-950 md:flex`}
        >
          {selectedUser ? (
            <>
              <header className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
                <button
                  onClick={() => setShowConversationList(true)}
                  className="rounded-lg p-2 text-slate-300 hover:bg-white/10 md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 font-semibold text-slate-950">
                  {getInitial(selectedUser)}
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950 ${
                      onlineUsers.includes(selectedUser.id) ? "bg-emerald-400" : "bg-slate-500"
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{getDisplayName(selectedUser)}</h2>
                  <p className="text-xs text-slate-400">
                    {onlineUsers.includes(selectedUser.id) ? "Online now" : "Offline"}
                  </p>
                </div>
              </header>

              <div ref={messagesParentRef} className="flex-1 overflow-y-auto px-4 py-5">
                {loadingMessages ? (
                  <div className="space-y-4">
                    <div className="h-14 w-56 animate-pulse rounded-2xl bg-white/10" />
                    <div className="ml-auto h-14 w-64 animate-pulse rounded-2xl bg-cyan-400/20" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
                    Start the conversation with {getDisplayName(selectedUser)}.
                  </div>
                ) : (
                  <div style={{ height: `${messageVirtualizer.getTotalSize()}px`, position: "relative" }}>
                    {messageVirtualizer.getVirtualItems().map((virtualItem) => {
                      const message = messages[virtualItem.index];
                      const isMine = message.sender_id === currentUser.id;

                      return (
                        <div
                          key={message.id}
                          data-index={virtualItem.index}
                          ref={messageVirtualizer.measureElement}
                          style={{
                            transform: `translateY(${virtualItem.start}px)`,
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                          }}
                          className="pb-4"
                        >
                          <ChatBubble
                            message={message}
                            isMine={isMine}
                            timeLabel={
                              message.created_at
                                ? new Date(message.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Just now"
                            }
                            markdownRenderer={MarkdownRenderer as React.ComponentType<{ content: string; className?: string }>}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {typingUserId === selectedUser.id && (
                  <div className="text-sm text-cyan-300">{getDisplayName(selectedUser)} is typing...</div>
                )}

              </div>

              <div className="border-t border-white/10 p-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2">
                  <input
                    value={messageText}
                    onChange={(event) => handleMessageChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message"
                    className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-slate-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-4 text-center text-slate-400">
              Select a learner to start chatting.
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Chat;

