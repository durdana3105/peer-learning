import { useState, useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, List } from "lucide-react";
import type { ScheduledSession } from "@/hooks/useSessionStatus";
import { generateICS } from "@/utils/calendar";

// ── helpers ───────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-cyan-500/20 border-cyan-400/30 text-cyan-300",
  live: "bg-red-500/20 border-red-400/30 text-red-300",
  ended: "bg-white/5 border-white/10 text-gray-400",
};

function statusLabel(s: string) {
  if (s === "live") return "🔴 LIVE";
  if (s === "ended") return "Ended";
  return "Scheduled";
}

// ── Session event block ────────────────────────────────────────
function EventBlock({
  session,
  onClick,
}: {
  session: ScheduledSession;
  onClick: () => void;
}) {
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
}

// ── List row ──────────────────────────────────────────────────
function ListRow({
  session,
  onClick,
}: {
  session: ScheduledSession;
  onClick: () => void;
}) {
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
}

// ── Props ─────────────────────────────────────────────────────
interface CalendarViewProps {
  sessions: ScheduledSession[];
  onSelectSession: (session: ScheduledSession) => void;
}

// ── Main component ────────────────────────────────────────────
export function CalendarView({ sessions, onSelectSession }: CalendarViewProps) {
  const [view, setView] = useState<"week" | "list">("week");
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Mon
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const sessionsByDay = useMemo(() => {
    const map: Record<string, ScheduledSession[]> = {};
    for (const day of weekDays) {
      const key = format(day, "yyyy-MM-dd");
      map[key] = sessions.filter(
        (s) => s.scheduled_at && isSameDay(parseISO(s.scheduled_at), day)
      );
    }
    return map;
  }, [sessions, weekDays]);

  // List view: upcoming + live sorted by time
  const listSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.status !== "ended")
        .sort(
          (a, b) =>
            new Date(a.scheduled_at ?? 0).getTime() -
            new Date(b.scheduled_at ?? 0).getTime()
        ),
    [sessions]
  );

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-5">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h2 className="text-xl font-bold">Upcoming Sessions</h2>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView("week")}
              className={`p-1.5 rounded-lg transition-all ${
                view === "week"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Week view"
            >
              <Calendar size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded-lg transition-all ${
                view === "list"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-gray-400 hover:text-white"
              }`}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>

          {/* Week nav (only in week view) */}
          {view === "week" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekStart((d) => addDays(d, -7))}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm px-2 text-gray-300">
                {format(weekStart, "MMM d")} –{" "}
                {format(addDays(weekStart, 6), "MMM d, yyyy")}
              </span>
              <button
                onClick={() => setWeekStart((d) => addDays(d, 7))}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Week grid ── */}
      {view === "week" && (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`text-center text-xs font-semibold pb-1 ${
                  isSameDay(day, new Date())
                    ? "text-cyan-300"
                    : "text-gray-400"
                }`}
              >
                <div className="uppercase opacity-60">
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-base font-bold ${
                    isSameDay(day, new Date())
                      ? "bg-cyan-500 text-black rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                      : ""
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="grid grid-cols-7 gap-1 min-h-[160px]">
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const daySessions = sessionsByDay[key] ?? [];
              return (
                <div
                  key={key}
                  className={`rounded-xl p-1 min-h-[120px] border ${
                    isSameDay(day, new Date())
                      ? "border-cyan-400/30 bg-cyan-500/5"
                      : "border-white/5 bg-white/2"
                  }`}
                >
                  {daySessions.map((s) => (
                    <EventBlock
                      key={s.id}
                      session={s}
                      onClick={() => onSelectSession(s)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── List view ── */}
      {view === "list" && (
        <div className="space-y-3">
          {listSessions.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              No upcoming sessions this week.
            </p>
          ) : (
            listSessions.map((s) => (
              <ListRow
                key={s.id}
                session={s}
                onClick={() => onSelectSession(s)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CalendarView;
