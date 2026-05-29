import { memo, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  const parentRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 92,
    overscan: 8,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
    }
  }, [messages, typing, virtualizer]);

  return (
    <div ref={parentRef} className="flex h-full flex-col overflow-y-auto bg-gray-100 p-4">
      <div style={{ height: totalSize + (typing ? 40 : 0), position: "relative" }}>
        {virtualItems.map((virtualItem) => {
          const message = messages[virtualItem.index];

          return (
            <div
              key={message.id}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              <MessageBubble
                text={message.text}
                sender={message.sender}
                time={message.time}
              />
            </div>
          );
        })}

        {typing ? (
          <div className="absolute left-0 top-0 w-full" style={{ transform: `translateY(${totalSize}px)` }}>
            <TypingIndicator />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default memo(ChatWindow);
