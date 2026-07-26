import { useState, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { useMessages, ProfileSummary } from "@/hooks/useMessages";
import { Sidebar } from "@/components/messages/Sidebar";
import { ChatWindow } from "@/components/messages/ChatWindow";

type MessagesProps = {
  user?: {
    id?: string | null;
  } | null;
};

export default function Messages({ user }: MessagesProps) {
  const currentUserId = user?.id;

  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);

  const {
    profiles,
    conversationSummaries,
    onlineUserIds,
    selectedUser,
    setSelectedUser,
    loadingUsers,
    loadingConversations,
    loadingThreadMessages,
    loadingMoreThreadMessages,
    hasMoreThreadMessages,
    loadMoreThreadMessages,
    threadMessages,
    selectedConversation,
    sendMessage,
  } = useMessages(currentUserId);

  const handleSelectProfile = useCallback((profile: ProfileSummary) => {
    setSelectedUser(profile);
    setShowSidebarOnMobile(false);
  }, [setSelectedUser]);

  if (!currentUserId) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#020617] px-4 text-white">
        <div className="max-w-md text-center">
          <MessageCircle className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
          <h1 className="text-2xl font-semibold">Sign in to view messages</h1>
          <p className="mt-2 text-sm text-slate-400">
            Real-time conversations are available after login.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-[#020617] via-[#020B1F] to-[#050014] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.12),transparent)]" />
      <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[340px] w-[340px] rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex h-[calc(100vh-4rem)] max-w-7xl overflow-hidden border-x border-white/10 bg-white/5 backdrop-blur-2xl">
        <Sidebar
          currentUserId={currentUserId}
          conversationSummaries={conversationSummaries}
          profiles={profiles}
          onlineUserIds={onlineUserIds}
          selectedUser={selectedUser}
          loadingUsers={loadingUsers}
          loadingConversations={loadingConversations}
          onSelectProfile={handleSelectProfile}
          showSidebarOnMobile={showSidebarOnMobile}
          onEscape={() => setShowSidebarOnMobile(true)}
        />

        <ChatWindow
          currentUserId={currentUserId}
          selectedUser={selectedUser}
          selectedConversation={selectedConversation}
          threadMessages={threadMessages}
          loadingThreadMessages={loadingThreadMessages}
          loadingMoreThreadMessages={loadingMoreThreadMessages}
          hasMoreThreadMessages={hasMoreThreadMessages}
          loadMoreThreadMessages={loadMoreThreadMessages}
          sendMessage={sendMessage}
          showSidebarOnMobile={showSidebarOnMobile}
          setShowSidebarOnMobile={setShowSidebarOnMobile}
        />
      </div>
    </main>
  );
}
