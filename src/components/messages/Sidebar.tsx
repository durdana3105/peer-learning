import { memo, useMemo, useState, useRef } from "react";
import { useChatShortcuts } from "@/hooks/useChatShortcuts";
import { Inbox, Search } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ProfileSummary, ConversationSummary, MessageRow } from "@/hooks/useMessages";
import { getDisplayName, getInitial, getRoleLabel, getMessageBody, formatTime, formatRelativeTime } from "./utils";

type ConversationRowProps = {
  profile: ProfileSummary;
  lastMessage: MessageRow | null;
  unreadCount: number;
  isOnline: boolean;
  isSelected: boolean;
  onSelect: (profile: ProfileSummary) => void;
};

const ConversationRow = memo(({ profile, lastMessage, unreadCount, isOnline, isSelected, onSelect }: ConversationRowProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(profile)}
      className={`flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition-all duration-300 ${
        isSelected
          ? "border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_30px_rgba(34,211,238,0.12)]"
          : "border-white/5 bg-white/5 hover:border-cyan-500/20 hover:bg-white/10"
      }`}
    >
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 font-semibold text-black">
        {getInitial(profile)}
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950 ${
            isOnline ? "bg-emerald-400" : "bg-slate-500"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{getDisplayName(profile)}</p>
            <p className="truncate text-xs text-slate-400">{getRoleLabel(profile)}</p>
          </div>

          {lastMessage?.created_at && (
            <span className="shrink-0 text-[11px] text-slate-500">{formatTime(lastMessage.created_at)}</span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="truncate text-sm text-slate-300">
            {lastMessage ? getMessageBody(lastMessage) : "Start the conversation"}
          </p>

          {unreadCount > 0 && (
            <span className="shrink-0 rounded-full bg-cyan-400 px-2.5 py-1 text-[11px] font-semibold text-slate-950">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

type SidebarProps = {
  currentUserId: string | null | undefined;
  conversationSummaries: ConversationSummary[];
  profiles: ProfileSummary[];
  onlineUserIds: string[];
  selectedUser: ProfileSummary | null;
  loadingUsers: boolean;
  loadingConversations: boolean;
  onSelectProfile: (profile: ProfileSummary) => void;
  showSidebarOnMobile: boolean;
  onEscape?: () => void;
};

export function Sidebar({
  currentUserId,
  conversationSummaries,
  profiles,
  onlineUserIds,
  selectedUser,
  loadingUsers,
  loadingConversations,
  onSelectProfile,
  showSidebarOnMobile,
  onEscape,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const conversationListRef = useRef<HTMLDivElement | null>(null);

  const filteredConversationSummaries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversationSummaries;

    return conversationSummaries.filter(({ profile, lastMessage }) => {
      const haystack = [
        getDisplayName(profile),
        profile.email ?? "",
        getRoleLabel(profile),
        lastMessage ? getMessageBody(lastMessage) : "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [conversationSummaries, search]);

  const filteredProfiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      if (profile.id === currentUserId) return false;
      if (!query) return true;

      const haystack = [getDisplayName(profile), profile.email ?? "", getRoleLabel(profile)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [currentUserId, profiles, search]);

  const conversationVirtualizer = useVirtualizer({
    count: filteredConversationSummaries.length,
    getScrollElement: () => conversationListRef.current,
    estimateSize: () => 96,
    overscan: 8,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  const navigatableItems = useMemo(() => {
    const items = [...filteredConversationSummaries.map((c) => c.profile)];
    filteredProfiles.forEach((p) => {
      if (!items.find((i) => i.id === p.id)) {
        items.push(p);
      }
    });
    return items;
  }, [filteredConversationSummaries, filteredProfiles]);

  useChatShortcuts({
    searchInputRef,
    items: navigatableItems,
    selectedItem: selectedUser,
    onSelect: onSelectProfile,
    onEscape,
    getItemId: (p) => p.id,
  });

  return (
    <aside
      className={`${showSidebarOnMobile ? "flex" : "hidden"} w-full flex-col border-r border-white/10 bg-slate-950/80 md:flex md:w-[380px]`}
    >
      <div className="border-b border-white/10 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Messages</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Inbox</h1>
            <p className="mt-2 text-sm text-slate-400">
              Conversations with mentors, learners, and peers.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-300">
            <Inbox className="h-5 w-5" />
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 shadow-inner shadow-black/10">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            ref={searchInputRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations or people"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Conversations</h2>
            <span className="text-xs text-slate-500">{conversationSummaries.length}</span>
          </div>

          {loadingUsers || loadingConversations ? (
            <div className="space-y-3">
              <div className="h-20 animate-pulse rounded-3xl bg-white/5" />
              <div className="h-20 animate-pulse rounded-3xl bg-white/5" />
              <div className="h-20 animate-pulse rounded-3xl bg-white/5" />
            </div>
          ) : filteredConversationSummaries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              {search.trim()
                ? "No conversations match your search."
                : "No conversations yet. Start a new one from the people list."}
            </div>
          ) : (
            <div ref={conversationListRef} className="h-[420px] overflow-y-auto pr-1">
              <div style={{ height: `${conversationVirtualizer.getTotalSize()}px`, position: "relative" }}>
                {conversationVirtualizer.getVirtualItems().map((virtualItem) => {
                  const item = filteredConversationSummaries[virtualItem.index];

                  return (
                    <div
                      key={item.profile.id}
                      data-index={virtualItem.index}
                      ref={conversationVirtualizer.measureElement}
                      style={{
                        transform: `translateY(${virtualItem.start}px)`,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                      }}
                      className="pb-2"
                    >
                      <ConversationRow
                        profile={item.profile}
                        lastMessage={item.lastMessage}
                        unreadCount={item.unreadCount}
                        isOnline={item.isOnline}
                        isSelected={selectedUser?.id === item.profile.id}
                        onSelect={onSelectProfile}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">People</h2>
            <span className="text-xs text-slate-500">{filteredProfiles.length}</span>
          </div>

          {loadingUsers ? (
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-3xl bg-white/5" />
              <div className="h-16 animate-pulse rounded-3xl bg-white/5" />
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              No people match your search.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProfiles.map((profile) => {
                const isSelected = selectedUser?.id === profile.id;
                const isOnline = onlineUserIds.includes(profile.id);

                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => onSelectProfile(profile)}
                    className={`flex w-full items-center gap-3 rounded-3xl border p-3 text-left transition-all duration-300 ${
                      isSelected
                        ? "border-cyan-400/60 bg-cyan-500/10"
                        : "border-white/5 bg-white/5 hover:border-cyan-500/20 hover:bg-white/10"
                    }`}
                  >
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 font-semibold text-slate-950">
                      {getInitial(profile)}
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950 ${
                          isOnline ? "bg-emerald-400" : "bg-slate-500"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">{getDisplayName(profile)}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                        <span>{getRoleLabel(profile)}</span>
                        <span>•</span>
                        <span>{isOnline ? "Online" : formatRelativeTime(profile.last_active || profile.last_seen) || "Offline"}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}