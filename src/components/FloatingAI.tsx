import { useState } from "react";
import { Bot, Send, X, User } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
const FloatingAI = () => {
  const [open, setOpen] =
    useState(false);

  const [messages, setMessages] =
    useState<any[]>([
      {
        role: "assistant",
        content:
          "Hey 👋 Ask me anything about coding, AI, DSA or roadmaps!",
      },
    ]);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const prompt = input;

    // USER MESSAGE
    const userMessage = {
      role: "user",
      content: prompt,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setInput("");

    setLoading(true);

    try {
      // The /api/chat endpoint is protected by requireAuth middleware.
      // Retrieve the session token from localStorage to authenticate.
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      const data = await response.json();

      // ERROR HANDLING
      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error,
          },
        ]);

        setLoading(false);

        return;
      }

      const aiReply = data?.reply || "AI could not respond 😔";

      // AI MESSAGE
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiReply,
        },
      ]);
    } catch (error) {
      console.log(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "AI failed 😔",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
        onClick={() =>
          setOpen(!open)
        }
        className="fixed bottom-6 right-6 z-50 bg-cyan-400 hover:bg-cyan-300 transition text-black p-4 rounded-full shadow-2xl"
      >
        {open ? (
          <X size={24} />
        ) : (
          <Bot size={24} />
        )}
      </button>

      {/* CHAT WINDOW */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[370px] h-[550px] bg-[#020617] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white backdrop-blur-xl">

          {/* HEADER */}
          <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">

            <div className="bg-cyan-400/20 p-2 rounded-xl">
              <Bot className="text-cyan-400" />
            </div>

            <div>
              <h2 className="font-bold">
                AI Assistant
              </h2>

              <p className="text-xs text-green-400">
                ● Online
              </p>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {messages.map(
              (msg, index) => {
                const isUser =
                  msg.role === "user";

                return (
                  <div
                    key={index}
                    className={`flex ${
                      isUser
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                        isUser
                          ? "bg-cyan-400 text-black"
                          : "bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">

                        {isUser ? (
                          <User size={14} />
                        ) : (
                          <Bot size={14} />
                        )}

                        <span className="text-xs font-semibold">
                          {isUser
                            ? "You"
                            : "AI"}
                        </span>
                      </div>

                      <p className="whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              }
            )}

            {/* LOADING */}
            {loading && (
              <div className="text-gray-400 text-sm">
                AI is typing...
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className="border-t border-white/10 p-3 flex gap-2">

            <input
              type="text"
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }

              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}

              placeholder="Ask AI..."
              className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-4 py-3 outline-none text-sm"
            />

            <button
              onClick={sendMessage}
              className="bg-cyan-400 hover:bg-cyan-300 transition text-black p-3 rounded-2xl"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAI;