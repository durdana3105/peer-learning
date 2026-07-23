import { useRef, useState, useEffect } from "react";
import { Send, Video, Sparkles, BellOff, Bell, Download, Pin, PinOff } from "lucide-react";
import { LiveCodeRunner } from "@/components/studyroom/LiveCodeRunner";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

type SessionChatProps = {
  selectedSession: any;
  messages: any[];
  activities: any[];
  userStatus: string;
  typingUser: string | null;
  participantCount: number;
  isVideoActive: boolean;
  sessionSummary: any;
  summaryLoading: boolean;
  studyTime: number;
  isFocusMode: boolean;
  setIsFocusMode: (val: boolean) => void;
  sendMessage: (msg: string) => void;
  togglePinMessage: (msgId: string, currentPinStatus: boolean) => void;
  sendTypingEvent: () => void;
  handleLeaveVideo: () => void;
  handleJoinVideo: () => void;
  user: any;
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
  isFocusMode,
  setIsFocusMode,
  sendMessage,
  togglePinMessage,
  sendTypingEvent,
  handleLeaveVideo,
  handleJoinVideo,
  user,
}: SessionChatProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const pinnedMessages = messages.filter((msg) => msg.is_pinned);

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

  const handleExport = () => {
    if (!selectedSession) return;
    
    let content = `# Study Session Export: ${selectedSession.title}\n\n`;
    
    if (sessionSummary) {
      content += `## AI Summary\n\n${sessionSummary.summary}\n\n`;
      if (sessionSummary.key_takeaways?.length > 0) {
        content += `### Key Takeaways\n`;
        sessionSummary.key_takeaways.forEach((takeaway: string) => {
          content += `- ${takeaway}\n`;
        });
        content += `\n`;
      }
    }

    content += `## Chat Logs\n\n`;
    messages.forEach((msg) => {
      const time = new Date(msg.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      content += `**[${time}] ${msg.username}:**\n${msg.message}\n\n`;
    });

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Session_Export_${selectedSession.title?.replace(/\s+/g, '_') || "Log"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
                        : userStatus === "Busy"
                        ? "bg-red-500/10 border-red-400/20 text-red-300"
                        : "bg-yellow-500/10 border-yellow-400/20 text-yellow-300"
                    }`}
                  >
                    {userStatus === "Active" ? "⚡ " : userStatus === "Busy" ? "⛔ " : "🌙 "}
                    {userStatus}
                  </div>

                  <button
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border w-fit transition-colors ${
                      isFocusMode
                        ? "bg-red-500/10 border-red-400/20 text-red-300"
                        : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                    }`}
                    title={isFocusMode ? "Disable Focus Mode" : "Enable Focus Mode (Sets status to Busy and silences notifications)"}
                  >
                    {isFocusMode ? <BellOff size={14} /> : <Bell size={14} />}
                    Focus Mode
                  </button>
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
            
            <button
              onClick={handleExport}
              title="Export Session Notes and Chat"
              className="flex items-center gap-2 bg-white/5 border border-white/10 text-cyan-300 hover:text-cyan-200 hover:bg-white/10 px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <Download size={18} />
              <span className="hidden md:inline">Export</span>
            </button>
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

          {/* PINNED MESSAGES HEADER */}
          {pinnedMessages.length > 0 && (
            <div className="mt-4 bg-white/5 border border-cyan-500/20 rounded-2xl p-4 shadow-lg shadow-cyan-500/5">
              <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                <Pin className="text-cyan-400" size={16} />
                <h3 className="font-semibold text-cyan-300 text-sm">Pinned Resources</h3>
              </div>
              <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                {pinnedMessages.map((msg) => (
                  <div key={`pinned-${msg.id}`} className="bg-black/20 rounded-xl p-3 border border-white/5 relative group">
                    <p className="text-xs text-cyan-500 font-medium mb-1">{msg.username}</p>
                    <div className="text-sm">
                      <MarkdownRenderer content={msg.message} />
                    </div>
                    <button
                      onClick={() => togglePinMessage(msg.id, true)}
                      className="absolute top-2 right-2 p-1.5 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-gray-400 hover:text-red-400 transition"
                      title="Unpin message"
                    >
                      <PinOff size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
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
                    className={`max-w-[80%] px-4 py-3 rounded-2xl overflow-hidden ${
                      isCurrentUser
                        ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-black"
                        : "bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      {!isCurrentUser && (
                        <p className="text-xs text-cyan-300">{msg.username}</p>
                      )}
                      {msg.is_pinned && isCurrentUser && (
                        <p className="text-xs text-black/60 font-bold ml-auto flex items-center gap-1"><Pin size={10} /> Pinned</p>
                      )}
                      {msg.is_pinned && !isCurrentUser && (
                        <p className="text-xs text-cyan-300/60 font-bold ml-auto flex items-center gap-1"><Pin size={10} /> Pinned</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => togglePinMessage(msg.id, !!msg.is_pinned)}
                      className={`absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition ${
                        isCurrentUser ? "hover:bg-black/10 text-black/70" : "hover:bg-white/10 text-white/70"
                      }`}
                      title={msg.is_pinned ? "Unpin message" : "Pin message"}
                    >
                      {msg.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>

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
