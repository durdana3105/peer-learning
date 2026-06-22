import { useState } from "react";
import { useChatbot } from "@/hooks/useChatbot";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, setInput, loading, chatEndRef, sendMessage } =
    useChatbot();

  return (
    <>
      {/* 💬 Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Assistant"
        title="Open AI Assistant"
        className="fixed bottom-5 left-5 z-[10000] bg-black text-white p-4 rounded-full shadow-xl hover:scale-110 transition"
      >
        💬
      </button>

      {/* 💻 Chatbox */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="chatbot-title"
          className="fixed bottom-20 left-5 z-[10000] w-80 h-[450px] bg-black text-white rounded-2xl shadow-2xl flex flex-col border border-gray-700"
        >
          {/* Header */}
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <span id="chatbot-title" className="font-semibold">
              AI Assistant
            </span>

            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Assistant"
              title="Close AI Assistant"
            >
              ✖
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}

            {loading && (
              <div className="bg-gray-800 p-2 rounded-lg text-sm animate-pulse">
                AI is typing...
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          {/* Input */}
          <ChatInput
            input={input}
            setInput={setInput}
            loading={loading}
            onSendMessage={sendMessage}
          />
        </div>
      )}
    </>
  );
}