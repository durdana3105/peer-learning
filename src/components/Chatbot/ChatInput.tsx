import React from "react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  onSendMessage: () => void;
}

export const ChatInput = React.memo(function ChatInput({
  input,
  setInput,
  loading,
  onSendMessage,
}: ChatInputProps) {
  return (
    <div className="p-2 border-t border-gray-700 flex gap-2">
      <input
        className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !loading && onSendMessage()}
        placeholder="Ask anything..."
        disabled={loading}
      />

      <button
        onClick={onSendMessage}
        disabled={loading}
        className="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600 transition disabled:opacity-50"
      >
        ➤
      </button>
    </div>
  );
});
