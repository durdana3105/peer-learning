import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  const API_KEY = "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";

  // 🧠 System prompt
  const systemPrompt = {
    role: "system",
    content:
      "You are a friendly, smart AI assistant. Talk clearly, slightly casual, helpful, and concise like ChatGPT.",
  };

  // ✅ Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ Load chats
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

  // 🔥 SEND MESSAGE
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    await supabase.from("chat_messages").insert([userMsg]);

    try {
      // 🧠 memory messages
      const formattedMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.text,
      }));

      const res = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-3.5-turbo",
            messages: [systemPrompt, ...formattedMessages, { role: "user", content: input }],
          }),
        }
      );

      const data = await res.json();
      console.log("AI:", data);

      const botReply =
        data?.choices?.[0]?.message?.content || "No response 😅";

      const botMsg = { role: "bot", text: botReply };

      // ⚡ typing animation
      let currentText = "";
      setMessages((prev) => [...prev, { role: "bot", text: "" }]);

      for (let i = 0; i < botReply.length; i++) {
        currentText += botReply[i];

        await new Promise((res) => setTimeout(res, 10));

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "bot",
            text: currentText,
          };
          return updated;
        });
      }

      await supabase.from("chat_messages").insert([botMsg]);

    } catch (err) {
      console.error("AI error:", err);
    }

    setLoading(false);
  };

  // 💻 Code formatting
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
    className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
    placeholder="Ask anything..."
  />

  <button
    onClick={sendMessage}
    className="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600 transition"
  >
    ➤
  </button>
</div>
        </div>
      )}
    </>
  );
}