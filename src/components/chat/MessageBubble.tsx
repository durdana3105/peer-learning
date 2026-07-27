import { memo, useMemo } from "react";
import { sanitizeMessageContent } from "@/utils/sanitize";

interface MessageBubbleProps {
  text: string;
  sender: "user" | "other";
  time: string;
}

const MessageBubble = ({
  text,
  sender,
  time,
}: MessageBubbleProps) => {
  const isUser = sender === "user";
  // SECURITY (#1852): Sanitize message content to prevent XSS on render
  const safeText = useMemo(() => sanitizeMessageContent(text), [text]);

  return (
    <div className={`flex mb-3 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl shadow ${
          isUser
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-white text-black rounded-bl-none"
        }`}
      >
        <p>{safeText}</p>
        <span className="block text-xs mt-1 opacity-70 text-right">{time}</span>
      </div>
    </div>
  );
};

export default memo(MessageBubble);
