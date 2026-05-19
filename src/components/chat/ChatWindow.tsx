import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

interface Message {
  id: number;
  text: string;
  sender: "user" | "other";
  time: string;
}

interface ChatWindowProps {
  messages: Message[];
  typing?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  typing = false,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  return (
    <div className="flex flex-col h-full bg-gray-100 p-4 overflow-y-auto">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          text={message.text}
          sender={message.sender}
          time={message.time}
        />
      ))}

      {typing && <TypingIndicator />}

      <div ref={bottomRef}></div>
    </div>
  );
};

export default ChatWindow;
