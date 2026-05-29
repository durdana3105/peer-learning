import React from "react";

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-1 px-4 py-2 w-fit bg-white rounded-2xl shadow mb-2">
      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300"></span>
    </div>
  );
};

export default TypingIndicator;
