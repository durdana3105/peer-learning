import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { API_BASE_URL } from "@/config/api";
type Message = {
  role: string;
  text: string;
  user_id?: string;
  created_at?: string;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const systemPrompt = {
    role: "system",
    content:
      "You are a friendly, smart AI assistant. Talk clearly, slightly casual, helpful, and concise like ChatGPT.",
  };

  // ✅ Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load only the current user's chat messages
  useEffect(() => {
    const loadChats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id" as any, session.user.id)
        .order("created_at", { ascending: true });

      if (data) setMessages(data as any[]);
    };
    loadChats();
  }, []);

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;

    // Store user_id so each message is scoped to the authenticated user.
    const userMsg = { role: "user", text: input, user_id: userId };


    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    await supabase.from("chat_messages").insert([userMsg]);

    try {
      const formattedMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.text,
      }));
      const res = await fetch(`${API_BASE_URL}/api/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: formattedMessages,
          systemPrompt: systemPrompt.content,
          model: "openai/gpt-4",
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();

      const botReply = data?.reply || "No response 😅";

      const botMsg = { role: "assistant", text: botReply, user_id: userId };


      // Smoother typing effect (chunked rendering)
      let currentText = "";
      const chunkSize = 3;

      setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

      for (let i = 0; i < botReply.length; i += chunkSize) {
        if (!isMounted.current) break;
        currentText += botReply.slice(i, i + chunkSize);

        await new Promise((resolve) => setTimeout(resolve, 20));

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            text: currentText,
          };
          return updated;
        });
      }

      await supabase.from("chat_messages").insert([botMsg]);
    } catch (err) {
      const errorMsg = { role: "assistant", text: "Something went wrong. Please try again.", user_id: userId };
      setMessages((prev) => [...prev, errorMsg]);
      await supabase.from("chat_messages").insert([errorMsg]);
    }

    setLoading(false);
  };

  // 💻 Code formatting (fixed)
  const formatMessage = (text: string) => {
    if (text.includes("```")) {
      const parts = text.split("```");

      return parts.map((part, i) =>
        i % 2 === 1 ? (
          <pre
            key={i}
            className="bg-black text-green-400 p-2 rounded text-xs overflow-x-auto"
          >
            {part}
          </pre>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    }
    return <span>{text}</span>;
  };

  return (
    <>
      {/* 💬 Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 left-5 z-[10000] bg-black text-white p-4 rounded-full shadow-xl hover:scale-110 transition"
      >
        💬
      </button>

      {/* 💻 Chatbox */}
      {isOpen && (
        <div className="fixed bottom-20 left-5 z-[10000] w-80 h-[450px] bg-black text-white rounded-2xl shadow-2xl flex flex-col border border-gray-700">
          
          {/* Header */}
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <span className="font-semibold">AI Assistant</span>
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-xl max-w-[80%] text-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 ml-auto"
                    : "bg-gray-800"
                }`}
              >
                {formatMessage(msg.text)}
              </div>
            ))}

            {loading && (
              <div className="bg-gray-800 p-2 rounded-lg text-sm animate-pulse">
                AI is typing...
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          {/* Input */}
          <div className="p-2 border-t border-gray-700 flex gap-2">
            <input
              className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
              placeholder="Ask anything..."
              disabled={loading}
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600 transition disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
