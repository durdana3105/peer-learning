import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

const Messages = () => {
  const { user } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 🔥 FETCH USERS (FIXED)
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email")
        .order("created_at", { ascending: true });

      console.log("USERS:", data);

      if (!data) return;

      const filtered = data.filter((u) => u.id !== user.id);
      setUsers(filtered);
    };

    fetchUsers();
  }, [user]);

  // 🔥 FETCH MESSAGES (FIXED QUERY)
  useEffect(() => {
    if (!selectedUser || !user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
         .from<any>("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      setMessages(data || []);
    };

    fetchMessages();
  }, [selectedUser, user]);

  // 🔥 SEND MESSAGE
  const sendMessage = async () => {
    if (!text.trim() || !selectedUser || !user) return;

    const newMsg = {
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: text,
      created_at: new Date().toISOString(),
    };

    // Optimistic UI
    setMessages((prev) => [...prev, newMsg]);

    await supabase.from<any>("messages").insert(newMsg);

    setText("");
  };

  // 🔥 REALTIME (FIXED FILTER)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new;

          if (
            (newMsg.sender_id === user.id &&
              newMsg.receiver_id === selectedUser?.id) ||
            (newMsg.sender_id === selectedUser?.id &&
              newMsg.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUser]);

  // 🔥 AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen bg-emerald-950 text-emerald-100">

      {/* 👥 USERS */}
      <div className="w-1/3 border-r border-white/10 p-4">
        <h2 className="font-semibold mb-4 text-lg">Users</h2>

        {users.length === 0 && (
          <p className="text-sm text-emerald-300/60">No users found</p>
        )}

        {users.map((u) => (
          <div
            key={u.id}
            onClick={() => setSelectedUser(u)}
            className={`p-3 rounded-lg cursor-pointer mb-2 transition ${
              selectedUser?.id === u.id
                ? "bg-green-500/20"
                : "hover:bg-white/5"
            }`}
          >
            <p className="font-medium">{u.name || "User"}</p>
            <p className="text-xs text-emerald-300/60">{u.email}</p>
          </div>
        ))}
      </div>

      {/* 💬 CHAT */}
      <div className="flex-1 flex flex-col p-4">

        {selectedUser ? (
          <>
            <h2 className="font-semibold mb-3 text-lg">
              Chat with {selectedUser.name || selectedUser.email}
            </h2>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2">

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.sender_id === user?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-xs ${
                      m.sender_id === user?.id
                        ? "bg-green-500 text-black"
                        : "bg-white/10"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 p-2 rounded bg-white/5 border border-white/10 outline-none"
                placeholder="Type message..."
              />
              <button
                onClick={sendMessage}
                className="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-emerald-300/60">
            Select a user to start chatting
          </div>
        )}

      </div>
    </div>
  );
};

export default Messages;