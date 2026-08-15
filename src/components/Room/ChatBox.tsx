import React, { Suspense, useState, useRef, useEffect } from "react";
import { User } from "@supabase/supabase-js";

// Lazy load the markdown renderer to match the original
const MarkdownRenderer = React.lazy(() =>
  import("@/components/MarkdownRenderer").then((module) => ({
    default: module.MarkdownRenderer,
  }))
);

interface ChatBoxProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
  user: User | null;
  onSendMessage: (msg: string) => Promise<void>;
}

const MAX_MESSAGE_LENGTH = 5000;

export const ChatBox = React.memo(function ChatBox({
  messages,
  user,
  onSendMessage,
}: ChatBoxProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isValidMessage = newMessage.trim().length > 0 && newMessage.length <= MAX_MESSAGE_LENGTH;
  const charCount = newMessage.length;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_MESSAGE_LENGTH) {
      setNewMessage(newValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidMessage) return;
    const msg = newMessage;
    setNewMessage("");
    await onSendMessage(msg);
  };

  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-lg">
      <div className="p-4 border-b border-slate-800 bg-slate-900/80">
        <h2 className="font-semibold text-slate-200">Room Discussion</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">
            Say hi to start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.profile_id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  isMe ? "items-end" : "items-start"
                }`}
              >
                <span className="text-xs text-slate-400 mb-1 ml-1 mr-1">
                  {isMe ? "You" : msg.profiles?.name || "Student"}
                </span>
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm md:text-base ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700"
                  }`}
                >
                  <Suspense
                    fallback={
                      <span className="text-slate-300">{msg.content}</span>
                    }
                  >
                    <MarkdownRenderer content={msg.content} />
                  </Suspense>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 border-t border-slate-800 bg-slate-950 p-4"
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type your message..."
            maxLength={MAX_MESSAGE_LENGTH}
            className="flex-1 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            disabled={!isValidMessage}
            title={isValidMessage ? "Send message" : "Message is empty or exceeds limit"}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Send
          </button>
        </div>
        <div className={`text-xs px-1 ${charCount >= MAX_MESSAGE_LENGTH ? "text-red-400" : "text-slate-400"}`}>
          {charCount} / {MAX_MESSAGE_LENGTH}
        </div>
      </form>
    </div>
  );
});
