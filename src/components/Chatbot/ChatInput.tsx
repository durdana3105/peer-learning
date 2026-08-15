import React, { useMemo } from "react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  onSendMessage: () => void;
}

const MAX_MESSAGE_LENGTH = 5000;

export const ChatInput = React.memo(function ChatInput({
  input,
  setInput,
  loading,
  onSendMessage,
}: ChatInputProps) {
  const isAtLimit = input.length >= MAX_MESSAGE_LENGTH;
  const charCount = input.length;
  const isValidMessage = useMemo(() => charCount > 0 && charCount <= MAX_MESSAGE_LENGTH, [charCount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_MESSAGE_LENGTH) {
      setInput(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading && isValidMessage) {
      onSendMessage();
    }
  };

  return (
    <div className="p-2 border-t border-gray-700 flex flex-col gap-1">
      <div className="flex gap-2">
        <input
          className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={loading}
          maxLength={MAX_MESSAGE_LENGTH}
        />

        <button
          onClick={onSendMessage}
          disabled={loading || !isValidMessage}
          className="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600 transition disabled:opacity-50"
          title={isValidMessage ? "Send message" : "Message is empty or exceeds limit"}
        >
          ➤
        </button>
      </div>

      <div className={`text-xs px-2 ${isAtLimit ? "text-red-400" : "text-gray-400"}`}>
        {charCount} / {MAX_MESSAGE_LENGTH}
      </div>
    </div>
  );
});
