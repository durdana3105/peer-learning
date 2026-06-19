import React from "react";
import { format, parseISO } from "date-fns";
import type { ScheduledSession } from "@/hooks/useSessionStatus";
import { STATUS_COLOR, statusLabel } from "./utils";

interface ListRowProps {
  session: ScheduledSession;
  onClick: () => void;
}

export const ListRow = React.memo(function ListRow({
  session,
  onClick,
}: ListRowProps) {
  const dt = session.scheduled_at ? parseISO(session.scheduled_at) : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-xl transition-all hover:brightness-110 ${
        STATUS_COLOR[session.status] ?? STATUS_COLOR.scheduled
      }`}
    >
      {/* Date block */}
      <div className="shrink-0 w-14 text-center">
        {dt ? (
          <>
            <div className="text-xs uppercase opacity-60">
              {format(dt, "MMM")}
            </div>
            <div className="text-2xl font-bold leading-none">
              {format(dt, "d")}
            </div>
            <div className="text-xs opacity-60">{format(dt, "EEE")}</div>
          </>
        ) : (
          <span className="text-xs opacity-50">TBD</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{session.title}</div>
        <div className="text-xs opacity-70 mt-0.5 truncate">
          {dt ? format(dt, "p") : ""} · {session.duration_minutes} min
        </div>
        {session.tags?.length ? (
          <div className="flex flex-wrap gap-1 mt-1">
            {session.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-white/10 px-2 py-0.5 rounded-full text-[10px]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 text-xs font-semibold">
        {statusLabel(session.status)}
      </div>
    </button>
  );
});
