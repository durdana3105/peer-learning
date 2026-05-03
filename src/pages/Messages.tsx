import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

const Messages = () => {
  const { user } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  // ✅ Fetch all users (except me)
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      const { data } = await (supabase as any)
        .from("profiles")
        .select("*")
        .neq("id", user.id);

      setUsers(data || []);
    };

    fetchUsers();
  }, [user]);

  // ✅ Fetch messages when user selected
  useEffect(() => {
    if (!selectedUser || !user) return;

    const fetchMessages = async () => {
      const { data } = await (supabase as any)
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),
           and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`
        )
        .order("created_at");

      setMessages(data || []);
    };

    fetchMessages();
  }, [selectedUser, user]);

  // ✅ Send message (with instant UI update)
  const sendMessage = async () => {
    if (!text.trim() || !selectedUser || !user) return;

    const newMsg = {
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: text,
      created_at: new Date().toISOString(),
    };

    // 🔥 Optimistic UI update
    setMessages((prev) => [...prev, newMsg]);

    await (supabase as any).from("messages").insert(newMsg);

    setText("");
  };

  // ✅ Real-time updates (filtered)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new;

          // 🔥 Only add relevant messages
          if (
            newMsg.sender_id === user.id ||
            newMsg.receiver_id === user.id
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="flex h-screen">

      {/* 👥 USER LIST */}
      <div className="w-1/3 border-r p-4">
        <h2 className="font-bold mb-3">Users</h2>

        {users.map((u) => (
          <div
            key={u.id}
            onClick={() => setSelectedUser(u)}
            className={`p-2 cursor-pointer rounded ${
              selectedUser?.id === u.id ? "bg-gray-200" : ""
            }`}
          >
            {u.name || u.email}
          </div>
        ))}
      </div>

      {/* 💬 CHAT AREA */}
      <div className="flex-1 p-4 flex flex-col">
        {selectedUser ? (
          <>
            <h2 className="font-bold mb-2">
              Chat with {selectedUser.name || selectedUser.email}
            </h2>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto border p-3 mb-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`mb-2 ${
                    m.sender_id === user?.id ? "text-right" : "text-left"
                  }`}
                >
                  <span className="bg-gray-200 px-2 py-1 rounded">
                    {m.content}
                  </span>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="border p-2 flex-1"
                placeholder="Type message..."
              />
              <button
                onClick={sendMessage}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500">Select a user to start chatting</p>
        )}
      </div>
    </div>
  );
};

export default Messages;