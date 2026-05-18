import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MessageCircle, Search, Send } from "lucide-react";

import { AuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url?: string | null;
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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      `${user.name ?? ""} ${user.email ?? ""}`.toLowerCase().includes(query)
    );
  }, [search, users]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUserId]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const loadUsers = async () => {
      setLoadingUsers(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,email,avatar_url")
        .neq("id", currentUser.id)
        .order("name", { ascending: true });

      if (!error && data) {
        setUsers(data);
        setSelectedUser((current) => current ?? data[0] ?? null);
      }

      setLoadingUsers(false);
    };

    loadUsers();
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
        .select("id,sender_id,receiver_id,content,text,created_at,read_at")
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

    const messageChannel = supabase
      .channel(`chat-messages-${currentUser.id}-${selectedUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
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
        }
      )
      .subscribe();

    const typingChannel = supabase
      .channel(`chat-typing-${[currentUser.id, selectedUser.id].sort().join("-")}`)
      .on("broadcast", { event: "typing" }, ({ payload }) => {
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

  const sendTypingStatus = async (isTyping: boolean) => {
    if (!currentUser?.id || !selectedUser?.id) return;

    await supabase
      .channel(`chat-typing-${[currentUser.id, selectedUser.id].sort().join("-")}`)
      .send({
        type: "broadcast",
        event: "typing",
        payload: {
          senderId: currentUser.id,
          receiverId: selectedUser.id,
          isTyping,
        },
      });
  };

  const handleMessageChange = (value: string) => {
    setMessageText(value);
    sendTypingStatus(Boolean(value.trim()));

    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }

    stopTypingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 1200);
  };

  const sendMessage = async () => {
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
    }
  };

  const selectUser = (user: Profile) => {
    setSelectedUser(user);
    setShowConversationList(false);
    setTypingUserId(null);
  };

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

          <div className="flex-1 overflow-y-auto p-3">
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
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isOnline = onlineUsers.includes(user.id);
                  const isSelected = selectedUser?.id === user.id;

                  return (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
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

              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
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
                  messages.map((message) => {
                    const isMine = message.sender_id === currentUser.id;
                    const body = message.content || message.text || "";

                    return (
                      <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm md:max-w-[68%] ${
                            isMine
                              ? "rounded-br-md bg-cyan-400 text-slate-950"
                              : "rounded-bl-md border border-white/10 bg-white/10 text-white"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">{body}</p>
                          <p className={`mt-1 text-[11px] ${isMine ? "text-slate-700" : "text-slate-400"}`}>
                            {message.created_at
                              ? new Date(message.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

                {typingUserId === selectedUser.id && (
                  <div className="text-sm text-cyan-300">{getDisplayName(selectedUser)} is typing...</div>
                )}

                <div ref={messagesEndRef} />
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
