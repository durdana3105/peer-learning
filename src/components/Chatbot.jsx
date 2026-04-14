import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  // ✅ Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Load previous chats
  useEffect(() => {
    const loadChats = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    };

    loadChats();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await supabase.from("chat_messages").insert([userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      const botMsg = { role: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMsg]);

      await supabase.from("chat_messages").insert([botMsg]);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  // ✅ Code formatting
  const formatMessage = (text) => {
    if (text.includes("```")) {
      const code = text.split("```")[1];
      return (
        <pre className="bg-black text-green-400 p-2 rounded text-xs overflow-x-auto">
          {code}
        </pre>
      );
    }
    return <span>{text}</span>;
  };

  return (
    <>
      {/* 💬 FLOATING BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          zIndex: 9999,
        }}
        className="bg-black text-white p-4 rounded-full shadow-xl hover:scale-110 transition"
      >
        💬
      </button>

      {/* 💻 CHAT WINDOW */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            left: "20px",
            zIndex: 9999,
            color: "#4b15158c",
          }}
          className="w-80 h-[450px] bg-black text-white rounded-2xl shadow-2xl flex flex-col border border-gray-700"
        >
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
                className={`p-2 rounded-lg max-w-[80%] text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 ml-auto"
                    : "bg-gray-800"
                }`}
              >
                {formatMessage(msg.text)}
              </div>
            ))}

            {/* ⏳ Typing */}
            {loading && (
              <div className="bg-gray-800 p-2 rounded-lg text-sm w-fit animate-pulse">
                AI is typing...
                color: #e436368c;
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          {/* Input */}
          <div className="p-2 border-t border-gray-700 flex gap-2">
            <input
              className="flex-1 bg-gray-900 border border-gray-700 p-2 rounded text-white text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 px-3 rounded text-sm"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}