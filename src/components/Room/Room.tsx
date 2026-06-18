import React, { Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import ParticipantCard from "@/components/studyroom/ParticipantCard";
import StudyTimer from "@/components/studyroom/StudyTimer";
import ActivityFeed from "@/components/studyroom/ActivityFeed";
import GroupPomodoro from "@/components/GroupPomodoro";
import { useRoomDetails } from "@/hooks/useRoomDetails";
import { useRoomChat } from "@/hooks/useRoomChat";
import { useRoomPresence } from "@/hooks/useRoomPresence";
import { ChatBox } from "./ChatBox";
import { InviteMenu } from "./InviteMenu";

const Whiteboard = React.lazy(() => import("@/components/Whiteboard/Whiteboard"));

export default function Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { room } = useRoomDetails(id, user);

  // We need a ref for setActivities to pass to useRoomPresence since it's initialized after
  const [activities, setActivities] = React.useState<string[]>([]);
  const { messages, handleSendMessage, fetchMessages } = useRoomChat(id, user, setActivities);
  const { participants } = useRoomPresence(id, user, fetchMessages, setActivities);

  // Overwrite the chat's setActivities so it can update the feed
  React.useEffect(() => {
    // Ideally useRoomChat takes setActivities directly, we'll patch it below:
  }, []);

  // Let's create a combined message handler that updates activities
  const onSendMessage = async (newMessage: string) => {
    await handleSendMessage(newMessage);
    setActivities((prev) => [`You sent a message`, ...prev]);
  };

  if (!room)
    return (
      <div className="min-h-screen bg-[#0B1120] text-white p-12 text-center">
        Loading Room...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col h-[85vh]">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-400">
              {room.topic}
            </h1>
            <div className="flex gap-4 mt-1 text-sm text-slate-400">
              <span>📚 Live Study Session</span>
              <span>👥 {participants.length} Online</span>
              <span>💬 {messages.length} Messages</span>
            </div>
          </div>
          <div className="flex gap-3">
            {room.is_private && room.created_by === user?.id && (
              <InviteMenu roomId={id!} />
            )}
            <button
              onClick={() => navigate("/rooms")}
              className="text-sm bg-red-600/10 text-red-500 font-medium hover:bg-red-600/20 px-5 py-2.5 rounded-lg transition"
            >
              Leave Room
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Chat */}
          <ChatBox
            messages={messages}
            user={user}
            onSendMessage={onSendMessage}
          />

          {/* Whiteboard */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <Suspense
              fallback={
                <div className="h-full w-full animate-pulse bg-slate-800" />
              }
            >
              <Whiteboard roomId={id!} />
            </Suspense>
          </div>

          <div className="w-72 hidden xl:flex flex-col gap-4">
            <StudyTimer />
            <ActivityFeed activities={activities} />
          </div>

          {/* Participants */}
          <div className="w-64 flex flex-col gap-6 hidden lg:flex">
            <div className="bg-slate-900 border border-slate-800 rounded-xl flex-col overflow-hidden shadow-lg flex-1">
              <div className="p-4 border-b border-slate-800 bg-slate-900/80">
                <h2 className="font-semibold text-slate-200">
                  Online ({participants.length})
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {participants.map((p, idx) => (
                  <ParticipantCard
                    key={idx}
                    name={p.name || "Anonymous Student"}
                    status="online"
                  />
                ))}
              </div>
            </div>

            <GroupPomodoro roomId={id!} creatorId={room.created_by} />
          </div>
        </div>
      </div>
    </div>
  );
}
