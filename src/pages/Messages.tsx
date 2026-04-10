import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const Messages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState<any>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null);

  // 🔥 Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  // 🔥 Fetch messages + realtime
  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    };

    fetchMessages();

    // 🔥 realtime updates
    const channel = supabase
      .channel("chat")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // 🔥 Send message
  const sendMessage = async () => {
    if (!text.trim() || !receiverId) return;

    await supabase.from("messages").insert([
      {
        sender_id: user.id,
        receiver_id: receiverId,
        text,
      },
    ]);

    setText("");
  };

  // 🔥 Get unique chat users
  const chatUsers = Array.from(
    new Set(
      messages.map((m) =>
        m.sender_id === user?.id ? m.receiver_id : m.sender_id
      )
    )
  );

  const selectedMessages = messages.filter(
    (m) =>
      (m.sender_id === user?.id && m.receiver_id === receiverId) ||
      (m.sender_id === receiverId && m.receiver_id === user?.id)
  );

  return (
    <div className="min-h-screen p-6">
      <motion.h1 className="text-2xl font-bold flex items-center gap-2">
        <MessageCircle /> Messages
      </motion.h1>

      <div className="mt-6 grid grid-cols-[250px_1fr] gap-4">
        
        {/* Chat list */}
        <div className="border rounded p-3">
          {chatUsers.map((id) => (
            <button
              key={id}
              onClick={() => setReceiverId(id)}
              className={`block w-full text-left p-2 rounded ${
                receiverId === id ? "bg-gray-200" : ""
              }`}
            >
              User: {id.slice(0, 6)}
            </button>
          ))}
        </div>

        {/* Chat area */}
        <div className="border rounded p-4 flex flex-col">
          {receiverId ? (
            <>
              <div className="flex-1 overflow-y-auto space-y-2">
                {selectedMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded max-w-xs ${
                      m.sender_id === user?.id
                        ? "bg-blue-500 text-white self-end"
                        : "bg-gray-200"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type message..."
                />
                <Button onClick={sendMessage}>
                  <Send size={16} />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a chat
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;