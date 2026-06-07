import { useRef, useState, useEffect } from "react";
import { Send, Video, Sparkles } from "lucide-react";
import { LiveCodeRunner } from "@/components/studyroom/LiveCodeRunner";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { UnknownRecord, UnknownArray } from "@/types/wrappers";

type SessionChatProps = {
  selectedSession: UnknownRecord;
  messages: UnknownArray;
  activities: UnknownArray;
  userStatus: string;
  typingUser: string | null;
  participantCount: number;
  isVideoActive: boolean;
  sessionSummary: UnknownRecord;
  summaryLoading: boolean;
  studyTime: number;
  sendMessage: (msg: string) => void;
  sendTypingEvent: () => void;
  handleLeaveVideo: () => void;
  handleJoinVideo: () => void;
  user: UnknownRecord;
};

export function SessionChat({
  selectedSession,
  messages,
  activities,
  userStatus,
  typingUser,
  participantCount,
  isVideoActive,
  sessionSummary,
  summaryLoading,
  studyTime,
  sendMessage,
  sendTypingEvent,
  handleLeaveVideo,
  handleJoinVideo,
  user,
}: SessionChatProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-5 flex flex-col h-[750px]">
      {selectedSession ? (
        <>
          {/* CHAT HEADER */}
          <div className="pb-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Session Chat 💬</h2>
              <p className="text-gray-400 text-sm">{selectedSession?.title}</p>
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-400/20 text-green-300 px-3 py-1 rounded-full text-sm w-fit">
                    🟢 {participantCount} learner{participantCount !== 1 ? "s" : ""} online
                  </div>

                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border w-fit ${
                      userStatus === "Active"
                        ? "bg-cyan-500/10 border-cyan-400/20 text-cyan-300"
                        : "bg-yellow-500/10 border-yellow-400/20 text-yellow-300"
                    }`}
                  >
                    {userStatus === "Active" ? "⚡" : "🌙"}
                    {userStatus}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">Shared Study Timer</h3>
                    <span className="text-cyan-300 font-mono text-lg">
                      {formatTime(studyTime)}
                    </span>
                  </div>

                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full transition-all duration-1000"
                      style={{
                        width: `${(studyTime / 3600) * 100}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Synchronized collaborative study session timer
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isVideoActive && (
            <div className="mb-3 bg-purple-500/10 border border-purple-400/20 text-purple-300 px-3 py-2 rounded-xl text-sm">
              🎥 Collaborative video study session is active
            </div>
          )}

          {selectedSession && !isVideoActive && (
            <button
              onClick={handleJoinVideo}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-black px-4 py-2 rounded-2xl font-bold hover:opacity-90 transition mt-4"
            >
              <Video size={18} /> Join Video
            </button>
          )}
          {selectedSession && isVideoActive && (
            <button
              onClick={handleLeaveVideo}
              className="flex items-center gap-2 bg-white/10 border border-white/10 text-white px-4 py-2 rounded-2xl font-bold hover:bg-white/20 transition mt-4"
            >
              Leave Video
            </button>
          )}

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto py-5 space-y-4">
            {messages.map((msg) => {
              const isCurrentUser = msg.user_id === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      isCurrentUser
                        ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-black"
                        : "bg-white/10"
                    }`}
                  >
                    {!isCurrentUser && (
                      <p className="text-xs text-cyan-300 mb-1">{msg.username}</p>
                    )}

                    <MarkdownRenderer content={msg.message} />

                    <p className="text-[10px] opacity-70 mt-2">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* TYPING INDICATOR */}
          {typingUser && (
            <div className="mb-4 bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-4 py-3 rounded-2xl text-sm animate-pulse">
              {typingUser} is typing...
            </div>
          )}

          {/* ACTIVITY FEED */}
          <div className="border-t border-white/10 pt-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                ⚡ Live Activity
              </h3>
              <span className="text-xs text-cyan-300">Real-time updates</span>
            </div>

            <div className="space-y-3 max-h-40 overflow-y-auto">
              {activities.length === 0 ? (
                <div className="text-sm text-gray-500">No recent activity yet.</div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-white/5 border border-white/10 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white">{activity.text}</p>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* INPUT */}
          <div className="pt-4 border-t border-white/10 flex gap-3">
            <LiveCodeRunner 
              onShare={(code, lang, output) => {
                let formattedMessage = `\`\`\`${lang}\n${code}\n\`\`\``;
                if (output) {
                  formattedMessage += `\n**Output:**\n\`\`\`text\n${output}\n\`\`\``;
                }
                sendMessage(formattedMessage);
              }}
            />
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                sendTypingEvent();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage(message);
                  setMessage("");
                }
              }}
              className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-white"
            />

            <button
              onClick={() => {
                sendMessage(message);
                setMessage("");
              }}
              className="bg-gradient-to-r from-cyan-400 to-purple-500 text-black p-4 rounded-2xl hover:opacity-90 transition"
            >
              <Send size={20} />
            </button>
          </div>

          {/* SUMMARY LOADING */}
          {summaryLoading && (
            <div className="mt-5 bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-cyan-300 font-semibold">Generating AI Summary...</p>
            </div>
          )}

          {/* SESSION SUMMARY */}
          {sessionSummary && (
            <div className="mt-5 bg-white/5 border border-cyan-400/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="text-cyan-400" size={20} />
                <h3 className="text-xl font-bold">Session Summary</h3>
              </div>
              <p className="text-gray-300 mb-5">{sessionSummary.summary}</p>
              {sessionSummary.key_takeaways?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-cyan-300">Key Takeaways</h4>
                  <ul className="space-y-2">
                    {sessionSummary.key_takeaways.map((takeaway: string, index: number) => (
                      <li key={index} className="text-gray-300 flex gap-2">
                        <span>•</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center text-gray-500 flex-col gap-3">
          <Sparkles size={40} className="text-cyan-500/30" />
          <p>Select or create a session to join the chat</p>
        </div>
      )}
    </div>
  );
}
