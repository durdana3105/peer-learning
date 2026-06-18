import React from "react";
import { format, parseISO } from "date-fns";
import type { ScheduledSession } from "@/hooks/useSessionStatus";
import { STATUS_COLOR } from "./utils";

interface EventBlockProps {
  session: ScheduledSession;
  onClick: () => void;
}

export const EventBlock = React.memo(function EventBlock({
  session,
  onClick,
}: EventBlockProps) {
  const time = session.scheduled_at
    ? format(parseISO(session.scheduled_at), "p")
    : "—";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2 py-1.5 rounded-lg border text-xs mb-1 truncate transition-all hover:brightness-110 ${
        STATUS_COLOR[session.status] ?? STATUS_COLOR.scheduled
      }`}
    >
      <span className="font-semibold block truncate">{session.title}</span>
      <span className="opacity-70">{time}</span>
    </button>
  );
});
