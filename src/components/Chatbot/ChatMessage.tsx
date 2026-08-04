import React, { Suspense } from "react";
import { Message } from "@/hooks/useChatbot";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = React.memo(function ChatMessage({ message }: ChatMessageProps) {
  const renderMessageContent = (text: string) => {
    if (message.role === "user") {
      return <span className="whitespace-pre-wrap">{text}</span>;
    }

    return (
      <Suspense fallback={<span className="whitespace-pre-wrap">{text}</span>}>
        <MarkdownRenderer
          content={text}
          className="prose-sm prose-invert text-sm whitespace-pre-wrap"
        />
      </Suspense>
    );
  };

  return (
    <div
      className={`px-3 py-2 rounded-xl max-w-[80%] text-sm ${
        message.role === "user"
          ? "bg-gradient-to-r from-blue-500 to-cyan-500 ml-auto"
          : "bg-gray-800"
      }`}
    >
      {renderMessageContent(message.text)}
    </div>
  );
});
