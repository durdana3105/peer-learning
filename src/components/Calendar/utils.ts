export const STATUS_COLOR: Record<string, string> = {
  scheduled: "bg-cyan-500/20 border-cyan-400/30 text-cyan-300",
  live: "bg-red-500/20 border-red-400/30 text-red-300",
  ended: "bg-white/5 border-white/10 text-gray-400",
};

export function statusLabel(s: string) {
  if (s === "live") return "🔴 LIVE";
  if (s === "ended") return "Ended";
  return "Scheduled";
}
