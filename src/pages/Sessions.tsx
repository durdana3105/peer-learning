import { Flame } from "lucide-react";
import { useAuth } from "@/contexts/useAuth";
import { useSessions } from "@/hooks/useSessions";
import { SessionFilters } from "@/components/sessions/SessionFilters";
import { SessionList } from "@/components/sessions/SessionList";
import { SessionChat } from "@/components/sessions/SessionChat";
import VideoRoom from "@/components/VideoRoom";

const tabs = ["Upcoming", "Joined", "Completed"];

export default function Sessions() {
  const { user } = useAuth();
  
  const {
    filteredSessions,
    messages,
    selectedTab,
    setSelectedTab,
    selectedSession,
    setSelectedSession,
    search,
    setSearch,
    activities,
    userStatus,
    typingUser,
    participantCount,
    isVideoActive,
    sessionSummary,
    summaryLoading,
    studyTime,
    handleJoinSession,
    sendMessage,
    sendTypingEvent,
    handleLeaveVideo,
    handleJoinVideo,
  } = useSessions(user);

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full" />

      <div className="relative z-10 p-6">
        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2">Sessions</h1>
          <p className="text-gray-400">Join collaborative learning sessions 🚀</p>
        </div>

        <SessionFilters
          tabs={tabs}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          search={search}
          setSearch={setSearch}
        />

        {/* CONTENT */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <Flame className="text-orange-400" />
              <h2 className="text-2xl font-bold">Live Learning Sessions</h2>
            </div>

            {isVideoActive && selectedSession ? (
              <VideoRoom
                roomName={selectedSession.id}
                userName={user?.user_metadata?.full_name || "Anonymous Learner"}
                onLeave={handleLeaveVideo}
              />
            ) : (
              <SessionList
                filteredSessions={filteredSessions}
                selectedSession={selectedSession}
                setSelectedSession={setSelectedSession}
                handleJoinSession={handleJoinSession}
              />
            )}
          </div>

          {/* RIGHT SIDE CHAT */}
          <div>
            <SessionChat
              selectedSession={selectedSession}
              messages={messages}
              activities={activities}
              userStatus={userStatus}
              typingUser={typingUser}
              participantCount={participantCount}
              isVideoActive={isVideoActive}
              sessionSummary={sessionSummary}
              summaryLoading={summaryLoading}
              studyTime={studyTime}
              sendMessage={sendMessage}
              sendTypingEvent={sendTypingEvent}
              handleLeaveVideo={handleLeaveVideo}
              handleJoinVideo={handleJoinVideo}
              user={user}
            />
          </div>
        </div>
      </div>
    </div>
  );
}