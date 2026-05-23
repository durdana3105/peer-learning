import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getStreakData,
  getStreakMilestone,
  getStreakAchievements,
  StreakData,
} from "@/lib/streakSystem";

export default function StreakStats() {
  const [data, setData] = useState<StreakData | null>(null);

  useEffect(() => {
    getStreakData().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 rounded-3xl bg-white/5" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 rounded-2xl bg-white/5" />
          <div className="h-24 rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  const milestone = getStreakMilestone(data.streak);
  const achievements = getStreakAchievements(data.streak);

  return (
    <div className="space-y-6">
      <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        className="group relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 p-8 backdrop-blur-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-purple-500/5 opacity-0 transition group-hover:opacity-100" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-slate-400">Daily Streak</p>
              <h3 className="mt-2 text-5xl font-black text-white">
                {milestone.emoji} {data.streak}d
              </h3>
              <p className="mt-2 text-lg text-cyan-300 font-semibold">
                {milestone.level}
              </p>
            </div>
            <div className="text-6xl opacity-30">{milestone.emoji}</div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Progress to {milestone.nextMilestone}d</span>
              <span className="font-semibold">{milestone.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${milestone.progress}%` }}
                transition={{ duration: 1 }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              />
            </div>
          </div>

          {milestone.reward && (
            <p className="mt-4 text-sm text-yellow-300 font-semibold">
              ✨ {milestone.reward}
            </p>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
          <p className="text-xs text-slate-400">Total XP</p>
          <p className="mt-2 text-3xl font-bold text-cyan-300">{data.totalXP}</p>
          <p className="mt-1 text-xs text-slate-500">Lifetime</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
        >
          <p className="text-xs text-slate-400">Daily Reward</p>
          <p className="mt-2 text-3xl font-bold text-blue-300">+{data.dailyXP}</p>
          <p className="mt-1 text-xs text-slate-500">Per day</p>
        </motion.div>
      </div>

      {achievements.length > 0 && (
        <motion.div
          whileHover={{ y: -3 }}
          className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-6 backdrop-blur-xl"
        >
          <h4 className="mb-3 font-semibold text-yellow-300">
            🏆 Unlocked Achievements
          </h4>
          <div className="flex flex-wrap gap-2">
            {achievements.map((achievement, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-full border border-yellow-400/50 bg-yellow-400/20 px-3 py-1 text-sm font-semibold text-yellow-300"
              >
                {achievement}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      <div className="text-xs text-slate-400 text-center">
        {data.restorationUsedToday ? (
          <p>✅ Streak restoration used today. Try again tomorrow!</p>
        ) : (
          <p>💡 Have a broken streak? Use 100 XP to restore it once per day.</p>
        )}
      </div>
    </div>
  );
}