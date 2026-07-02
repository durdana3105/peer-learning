import React from "react";
import { Message } from "@/hooks/useChatbot";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = React.memo(function ChatMessage({ message }: ChatMessageProps) {
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
    <div
      className={`px-3 py-2 rounded-xl max-w-[80%] text-sm ${
        message.role === "user"
          ? "bg-gradient-to-r from-blue-500 to-cyan-500 ml-auto"
          : "bg-gray-800"
      }`}
    >
      {formatMessage(message.text)}
    </div>
  );
});
