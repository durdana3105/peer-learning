import { memo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

interface Conversation {
  id: number;
  name: string;
  lastMessage: string;
  active?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (id: number) => void;
}

const ConversationList = ({ conversations, onSelect }: ConversationListProps) => {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 84,
    overscan: 6,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div className="flex h-full w-full flex-col border-r bg-white">
      <h2 className="border-b p-4 text-xl font-bold">Conversations</h2>

      <div ref={parentRef} className="relative flex-1 overflow-y-auto">
        <div style={{ height: totalSize, position: "relative" }}>
          {virtualItems.map((virtualItem) => {
            const conversation = conversations[virtualItem.index];

            return (
              <div
                key={conversation.id}
                onClick={() => onSelect(conversation.id)}
                className={`absolute left-0 top-0 w-full cursor-pointer border-b p-4 transition hover:bg-gray-100 ${
                  conversation.active ? "bg-gray-200" : ""
                }`}
                style={{ transform: `translateY(${virtualItem.start}px)` }}
              >
                <h3 className="font-semibold">{conversation.name}</h3>
                <p className="truncate text-sm text-gray-600">{conversation.lastMessage}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default memo(ConversationList);
