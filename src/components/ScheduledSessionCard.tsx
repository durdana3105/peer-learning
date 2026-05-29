import { format, parseISO } from "date-fns";
import { Calendar, Clock, Users, Video, Download } from "lucide-react";
import { motion } from "framer-motion";

import type { ScheduledSession } from "@/hooks/useSessionStatus";
import {
  useCountdown,
  formatCountdown,
  msUntilJoinWindow,
} from "@/hooks/useSessionStatus";
import { generateICS } from "@/utils/calendar";
import { MarkdownRenderer } from "./MarkdownRenderer";

// ── Status pill ───────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  scheduled:
    "bg-cyan-500/10 border-cyan-400/20 text-cyan-300",
  live: "bg-red-500/10 border-red-400/20 text-red-300 animate-pulse",
  ended: "bg-white/5 border-white/10 text-gray-400",
};

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "live" ? "🔴 LIVE NOW" : status === "ended" ? "Ended" : "Scheduled";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
        STATUS_STYLES[status] ?? STATUS_STYLES.scheduled
      }`}
    >
      {label}
    </span>
  );
}

// ── Join button with countdown ────────────────────────────────
function JoinButton({
  session,
  onJoin,
}: {
  session: ScheduledSession;
  onJoin: () => void;
}) {
  const msLeft = useCountdown(session.scheduled_at);
  const isLive = session.status === "live";
  const isEnded = session.status === "ended";
  const canJoin = isLive || msLeft <= 0;

  if (isEnded) {
    return (
      <button
        disabled
        className="flex-1 py-3 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed"
      >
        Session Ended
      </button>
    );
  }

  return (
    <button
      onClick={onJoin}
      disabled={!canJoin}
      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${
        canJoin
          ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-black hover:opacity-90"
          : "bg-white/5 border border-white/10 text-gray-400 cursor-not-allowed"
      }`}
    >
      {canJoin ? (
        <>
          <Video size={16} />
          {isLive ? "Join Live" : "Join Session"}
        </>
      ) : (
        <>
          <Clock size={14} />
          Opens in {formatCountdown(msLeft)}
        </>
      )}
    </button>
  );
}

// ── Main card ─────────────────────────────────────────────────
interface ScheduledSessionCardProps {
  session: ScheduledSession;
  isSelected?: boolean;
  onClick: () => void;
  onJoin: () => void;
}

export function ScheduledSessionCard({
  session,
  isSelected = false,
  onClick,
  onJoin,
}: ScheduledSessionCardProps) {
  const dt = session.scheduled_at ? parseISO(session.scheduled_at) : null;

  const handleAddToCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    generateICS(
      session.title ?? "Peer Learning Session",
      session.description ?? "Join us for a collaborative learning session.",
      dt ?? new Date(),
      session.duration_minutes
    );
  };

  return (
    <motion.div
      whileHover={{ scale: 1.015 }}
      onClick={onClick}
      className={`cursor-pointer rounded-3xl p-6 border backdrop-blur-xl transition-all ${
        isSelected
          ? "border-cyan-400 bg-cyan-500/10"
          : "border-white/10 bg-white/5 hover:border-cyan-400/30"
      }`}
    >
      {/* Status + title */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="text-xl font-bold leading-tight flex-1">
          {session.title}
        </h2>
        <StatusBadge status={session.status} />
      </div>

      {/* Description */}
      {session.description && (
        <div className="text-gray-300 text-sm mb-4 line-clamp-2">
          <MarkdownRenderer content={session.description} />
        </div>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
        {dt && (
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {format(dt, "PPP")} at {format(dt, "p")}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Clock size={14} />
          {session.duration_minutes} min
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={14} />
          Open session
        </span>
      </div>

      {/* Tags */}
      {session.tags?.length ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {session.tags.map((tag) => (
            <span
              key={tag}
              className="bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-3 py-1 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex gap-3">
        <JoinButton session={session} onJoin={onJoin} />
        <button
          onClick={handleAddToCalendar}
          title="Add to Calendar (.ics)"
          className="p-3 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition text-white"
        >
          <Download size={18} />
        </button>
      </div>
    </motion.div>
  );
}

export default ScheduledSessionCard;
