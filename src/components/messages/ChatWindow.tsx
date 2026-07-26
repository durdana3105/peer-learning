import { forwardRef, memo, useState, useEffect, useLayoutEffect, useRef } from "react";
import { ArrowLeft, Send, Phone, Video, Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ProfileSummary, ConversationSummary, MessageRow } from "@/hooks/useMessages";
import { getDisplayName, getMessageBody, getRoleLabel, formatRelativeTime, formatTime } from "./utils";

type ThreadBubbleProps = {
  message: MessageRow;
  isMine: boolean;
  timeLabel: string;
  isRead: boolean;
};

const ThreadBubble = memo(
  forwardRef<HTMLDivElement, ThreadBubbleProps>(function ThreadBubble(
    { message, isMine, timeLabel, isRead },
    ref
  ) {
    const body = getMessageBody(message);

    return (
      <div ref={ref} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[82%] rounded-3xl px-4 py-3 shadow-xl shadow-black/10 sm:max-w-[70%] ${
            isMine
              ? "rounded-br-md bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950"
              : "rounded-bl-md border border-white/10 bg-white/10 text-white backdrop-blur-xl"
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-6">{body}</p>
          <div className={`mt-2 flex items-center justify-between gap-3 text-[11px] ${isMine ? "text-slate-900/70" : "text-slate-400"}`}>
            <span>{timeLabel}</span>
            {isMine && isRead && <span>Read</span>}
          </div>
        </div>
      </div>
    );
  })
);

type ChatWindowProps = {
  currentUserId: string | null | undefined;
  selectedUser: ProfileSummary | null;
  selectedConversation: ConversationSummary | null;
  threadMessages: MessageRow[];
  loadingThreadMessages: boolean;
  loadingMoreThreadMessages: boolean;
  hasMoreThreadMessages: boolean;
  loadMoreThreadMessages: () => Promise<void>;
  sendMessage: (content: string) => Promise<boolean>;
  showSidebarOnMobile: boolean;
  setShowSidebarOnMobile: (show: boolean) => void;
};

export function ChatWindow({
  currentUserId,
  selectedUser,
  selectedConversation,
  threadMessages,
  loadingThreadMessages,
  loadingMoreThreadMessages,
  hasMoreThreadMessages,
  loadMoreThreadMessages,
  sendMessage,
  showSidebarOnMobile,
  setShowSidebarOnMobile,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const threadMessagesRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledRef = useRef(false);
  const prependAnchorRef = useRef<{ scrollHeight: number; firstMessageId: string | null } | null>(null);

  const threadVirtualizer = useVirtualizer({
    count: threadMessages.length,
    getScrollElement: () => threadMessagesRef.current,
    getItemKey: (index) => threadMessages[index].id,
    estimateSize: () => 92,
    overscan: 12,
  });

  // Auto-scroll to the newest message the first time a thread loads, and on
  // every subsequent new message. Loading older pages (which prepend to the
  // array) should not yank the view back down.
  useEffect(() => {
    if (threadMessages.length === 0) {
      hasAutoScrolledRef.current = false;
      return;
    }

    if (!hasAutoScrolledRef.current) {
      threadVirtualizer.scrollToIndex(threadMessages.length - 1, { align: "end" });
      hasAutoScrolledRef.current = true;
    }
  }, [threadMessages.length, threadVirtualizer]);

  useEffect(() => {
    hasAutoScrolledRef.current = false;
  }, [selectedUser?.id]);

  // When older messages are prepended, the browser keeps scrollTop fixed while
  // scrollHeight grows above the fold, which visually yanks the view down to a
  // different set of messages. Restore the offset the user was actually at,
  // but only if the first message actually changed - guards against a stale
  // anchor misfiring on an unrelated append (e.g. a new realtime message).
  useLayoutEffect(() => {
    const anchor = prependAnchorRef.current;
    const container = threadMessagesRef.current;
    if (!anchor || !container) return;

    const currentFirstMessageId = threadMessages[0]?.id ?? null;
    if (currentFirstMessageId !== anchor.firstMessageId) {
      container.scrollTop += container.scrollHeight - anchor.scrollHeight;
    }
    prependAnchorRef.current = null;
  }, [threadMessages]);

  const handleLoadMore = async () => {
    const container = threadMessagesRef.current;
    prependAnchorRef.current = container
      ? { scrollHeight: container.scrollHeight, firstMessageId: threadMessages[0]?.id ?? null }
      : null;
    await loadMoreThreadMessages();
  };

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;

    setNewMessage("");
    threadVirtualizer.scrollToIndex(threadMessages.length, { align: "end" });
    const success = await sendMessage(content);
    if (!success) {
      setNewMessage(content); // restore on failure
    }
  };

  const selectedDisplayName = selectedUser ? getDisplayName(selectedUser) : "Messages";
  const selectedSubtitle = selectedUser
    ? `${getRoleLabel(selectedUser)} • ${
        selectedConversation?.isOnline
          ? "Online now"
          : formatRelativeTime(selectedUser.last_active || selectedUser.last_seen) || "Offline"
      }`
    : "Pick a conversation or start a new one.";

  return (
    <section className={`${showSidebarOnMobile ? "hidden" : "flex"} min-w-0 flex-1 flex-col bg-slate-950 md:flex`}>
      {selectedUser ? (
        <>
          <header className="flex h-20 items-center justify-between border-b border-white/10 bg-white/5 px-4 backdrop-blur-2xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setShowSidebarOnMobile(true)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-white">{selectedDisplayName}</h2>
                <p className="truncate text-xs text-slate-400">{selectedSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:border-cyan-500/30 hover:bg-white/10 hover:text-cyan-300"
              >
                <Phone className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:border-cyan-500/30 hover:bg-white/10 hover:text-cyan-300"
              >
                <Video className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div ref={threadMessagesRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {loadingThreadMessages && threadMessages.length === 0 ? (
              <div className="space-y-3">
                <div className="ml-auto h-14 w-2/3 animate-pulse rounded-3xl bg-white/5" />
                <div className="h-14 w-2/3 animate-pulse rounded-3xl bg-white/5" />
                <div className="ml-auto h-14 w-1/2 animate-pulse rounded-3xl bg-white/5" />
              </div>
            ) : (
              <>
                {hasMoreThreadMessages && (
                  <div className="mb-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => void handleLoadMore()}
                      disabled={loadingMoreThreadMessages}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      {loadingMoreThreadMessages && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {loadingMoreThreadMessages ? "Loading earlier messages..." : "Load earlier messages"}
                    </button>
                  </div>
                )}

                <div style={{ height: `${threadVirtualizer.getTotalSize()}px`, position: "relative" }}>
                  {threadVirtualizer.getVirtualItems().map((virtualItem) => {
                    const message = threadMessages[virtualItem.index];
                    const isMine = message.sender_id === currentUserId;
                    const timeLabel = formatTime(message.created_at);

                    return (
                      <div
                        key={message.id}
                        data-index={virtualItem.index}
                        ref={threadVirtualizer.measureElement}
                        style={{
                          transform: `translateY(${virtualItem.start}px)`,
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                        }}
                        className="pb-3"
                      >
                        <ThreadBubble
                          message={message}
                          isMine={isMine}
                          timeLabel={timeLabel}
                          isRead={!!message.read_at}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-white/10 bg-slate-950 p-4 sm:p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-end gap-3 rounded-3xl border border-white/10 bg-white/5 p-2 shadow-inner shadow-black/10 transition focus-within:border-cyan-500/40 focus-within:bg-white/10"
            >
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                className="max-h-32 min-h-[44px] w-full resize-none bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                rows={1}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="mb-1 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 rounded-3xl border border-white/5 bg-white/5 p-6 shadow-2xl shadow-black/20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-cyan-300">
              <Send className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white">Your Messages</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Select a conversation from the sidebar or start a new one to begin messaging.
          </p>
        </div>
      )}
    </section>
  );
}