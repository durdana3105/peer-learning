import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getStreakData,
  getStreakMilestone,
  StreakData,
} from "@/lib/streakSystem";
import { Flame, Trophy, Zap } from "lucide-react";

export default function StreakXPWidget() {
  const [data, setData] = useState<StreakData | null>(null);

  useEffect(() => {
    getStreakData()
      .then(setData)
      .catch((err) => {
        console.error("Failed to load streak data:", err);
        // Fallback state
        setData({
          streak: 0,
          totalXP: 0,
          lastActive: new Date().toISOString(),
          restorationUsedToday: false,
          restorationDate: null,
          history: []
        });
      });
  }, []);

  if (!data) {
    return (
      <div className="animate-pulse h-full min-h-[160px] rounded-3xl bg-white/5 border border-white/5" />
    );
  }

  const milestone = getStreakMilestone(data.streak);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 flex flex-col justify-between h-full group"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10 pointer-events-none">
        <Trophy size={120} className="text-cyan-400" />
      </div>

      <div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Flame size={16} className="text-orange-500" />
              Daily Streak
            </h3>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">{data.streak}</span>
              <span className="text-slate-400">days</span>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2 justify-end">
              <Zap size={16} className="text-cyan-400" />
              Total XP
            </h3>
            <div className="mt-1 flex items-baseline gap-2 justify-end">
              <span className="text-3xl font-bold text-cyan-300">{data.totalXP}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 relative z-10">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-cyan-300 font-medium">{milestone.level}</span>
            <span className="text-slate-400">{milestone.progress}% to next</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${milestone.progress}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
