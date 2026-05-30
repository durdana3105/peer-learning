import { useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AIPage = () => {
  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content:
        "Hey 👋 I am your AI Matchmaking Assistant! Ask me to find the perfect peer mentor, trade tech skills, or display your highest ranked recommendations!",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const prompt = input;

    // USER MESSAGE
    const userMessage = {
      role: "user",
      content: prompt,
    };

    setMessages((prev: any) => [
      ...prev,
      userMessage,
    ]);

    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { prompt }
      });

      if (error) throw error;

      const aiReply = data?.choices?.[0]?.message?.content;

      setMessages((prev: any) => [
        ...prev,
        {
          role: "assistant",
          content: aiReply || "No response generated 😔",
        },
      ]);
    } catch (error) {
      console.log(error);
      setMessages((prev: any) => [
        ...prev,
        {
          role: "assistant",
          content: "AI Recommendation Engine failed 😔",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold mb-3">
          AI Matchmaker 🤖
        </h1>
        <p className="text-gray-400 text-lg">
          Find matched study peers, look up ranked mentors, and balance your technical learning goals.
        </p>
      </div>

      {/* CHAT CONTAINER */}
      <div className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-3xl h-[80vh] flex flex-col overflow-hidden backdrop-blur-xl">
        {/* TOP BAR */}
        <div className="border-b border-white/10 p-5 flex items-center gap-3">
          <div className="bg-cyan-400/20 p-3 rounded-2xl">
            <Bot className="text-cyan-400" />
          </div>
          <div>
            <h2 className="font-bold text-xl">
              AI Mentor Recommendation Engine
            </h2>
            <p className="text-sm text-green-400">● Live Profile Matching Active</p>
          </div>
        </div>

        {/* ALGORITHMIC SUGGESTION PILLS */}
        <div className="flex gap-3 overflow-x-auto p-4 border-b border-white/10">
          {[
            "Recommend the best UI/UX mentor for me",
            "Who can teach me Machine Learning?",
            "Find a perfect peer swap match for Python",
            "Show my top ranked mentor recommendations",
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => setInput(item)}
              className="bg-white/10 hover:bg-white/20 transition px-4 py-2 rounded-full whitespace-nowrap text-sm"
            >
              {item}
            </button>
          ))}
        </div>

        {/* MESSAGES LAYER */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.map((msg: any, index: number) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={index}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-5 py-4 rounded-3xl ${
                    isUser
                      ? "bg-cyan-400 text-black"
                      : "bg-white/10 border border-white/10"
                  }`}
                >
                  {/* METADATA HEADER */}
                  <div className="flex items-center gap-2 mb-2">
                    {isUser ? <User size={16} /> : <Bot size={16} />}
                    <span className="text-sm font-semibold">
                      {isUser ? "You" : "AI Matchmaker"}
                    </span>
                  </div>

                  {/* CHAT BUBBLE CONTENT */}
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}

          {/* STREAMING GENERATION LOADER */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-white/10 rounded-3xl px-5 py-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TEXT INPUT CONTROLS */}
        <div className="border-t border-white/10 p-4 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Ask AI to match you with peers..."
            className="flex-1 bg-white/10 rounded-2xl px-4 py-3 outline-none border border-white/10 focus:border-cyan-400 transition"
          />

          <button
            onClick={sendMessage}
            className="bg-cyan-400 hover:bg-cyan-300 transition text-black p-4 rounded-2xl"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIPage;