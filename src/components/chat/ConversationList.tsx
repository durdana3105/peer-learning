import React from "react";

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

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelect,
}) => {
  return (
    <div className="w-full h-full bg-white border-r overflow-y-auto">
      <h2 className="text-xl font-bold p-4 border-b">Conversations</h2>

      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelect(conversation.id)}
          className={`p-4 cursor-pointer border-b hover:bg-gray-100 transition ${
            conversation.active ? "bg-gray-200" : ""
          }`}
        >
          <h3 className="font-semibold">{conversation.name}</h3>
          <p className="text-sm text-gray-600 truncate">
            {conversation.lastMessage}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
