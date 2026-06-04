import { motion } from "framer-motion";
import { Calendar, Users, Clock, Sparkles } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { generateICS } from "@/utils/calendar";

type SessionListProps = {
  filteredSessions: any[];
  selectedSession: any;
  setSelectedSession: (session: any) => void;
  handleJoinSession: (e: React.MouseEvent, sessionId: string) => void;
};

export function SessionList({
  filteredSessions,
  selectedSession,
  setSelectedSession,
  handleJoinSession,
}: SessionListProps) {
  return (
    <div className="grid gap-5">
      {filteredSessions.length > 0 ? (
        filteredSessions.map((s) => (
          <motion.div
            whileHover={{
              scale: 1.02,
            }}
            key={s.id}
            onClick={() => setSelectedSession(s)}
            className={`cursor-pointer rounded-3xl p-6 border backdrop-blur-xl transition-all ${
              selectedSession?.id === s.id
                ? "border-cyan-400 bg-cyan-500/10"
                : "border-white/10 bg-white/5 hover:border-cyan-400/30"
            }`}
          >
            {/* LIVE BADGE */}
            {s.is_live && (
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-400/20 text-red-400 px-3 py-1 rounded-full text-sm mb-4">
                🔴 LIVE NOW
              </div>
            )}

            {/* TITLE */}
            <h2 className="text-2xl font-bold mb-3">{s.title}</h2>

            {/* DESCRIPTION */}
            <div className="text-gray-300 mb-5">
              <MarkdownRenderer content={s.description || ""} />
            </div>

            {/* DETAILS */}
            <div className="flex flex-wrap gap-5 text-sm text-gray-400 mb-5">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                {s.timing || "Today"}
              </div>

              <div className="flex items-center gap-2">
                <Users size={16} />
                {s.participants || 0} {s.seat_limit ? `/ ${s.seat_limit}` : ""}{" "}
                learners
              </div>

              <div className="flex items-center gap-2">
                <Clock size={16} />
                {s.duration || "1 Hour"}
              </div>
            </div>

            {/* MENTOR */}
            <div className="mb-5">
              <p className="text-gray-400 text-sm">Mentor</p>

              <p className="font-semibold">{s.mentor || "Sarah"}</p>
            </div>

            {/* TAGS */}
            <div className="flex flex-wrap gap-2 mb-5">
              {s.tags?.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3">
              <button
                onClick={(e) => handleJoinSession(e, s.id)}
                disabled={s.seat_limit && s.participants >= s.seat_limit}
                className={`flex-1 text-black py-3 rounded-2xl font-bold transition ${
                  s.seat_limit && s.participants >= s.seat_limit
                    ? "bg-gray-500 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-cyan-400 to-purple-500 hover:opacity-90"
                }`}
              >
                {s.seat_limit && s.participants >= s.seat_limit
                  ? "Session Full"
                  : "Join Session"}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  generateICS(
                    s.title || "Peer Learning Session",
                    s.description || "Join us for a collaborative learning session.",
                    s.scheduled_at ? new Date(s.scheduled_at) : new Date(),
                    1
                  );
                }}
                className="bg-white/10 border border-white/10 hover:bg-white/20 p-3 rounded-2xl transition text-white"
                title="Add to Calendar"
              >
                <Calendar size={24} />
              </button>
            </div>
          </motion.div>
        ))
      ) : (
        <div className="text-center py-20 border border-white/10 rounded-3xl bg-white/5">
          <Sparkles className="mx-auto text-gray-500 mb-4" size={50} />

          <h2 className="text-2xl font-bold mb-2">No Sessions Found</h2>

          <p className="text-gray-400">Try another tab or search.</p>
        </div>
      )}
    </div>
  );
}
