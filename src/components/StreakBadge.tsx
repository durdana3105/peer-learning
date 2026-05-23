import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  updateDailyStreak,
  getStreakData,
  restoreStreak,
  getStreakMilestone,
} from "@/lib/streakSystem";

export default function StreakBadge() {
  const [streak, setStreak] = useState<number | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [dailyXP, setDailyXP] = useState<number>(50);
  const [showModal, setShowModal] = useState(false);
  const [restorationMsg, setRestorationMsg] = useState("");
  const [canRestore, setCanRestore] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { streak: newStreak, xpEarned } = await updateDailyStreak();
      const data = await getStreakData();

      setStreak(newStreak);
      setXp(data.totalXP);
      setDailyXP(data.dailyXP);
      setCanRestore(data.canRestore);

      if (xpEarned > 0) {
        setRestorationMsg(`+${xpEarned} XP earned! 🎉`);
        setTimeout(() => setRestorationMsg(""), 3000);
      }
    };

    init();
  }, []);

  const handleRestore = async () => {
    const result = await restoreStreak();
    setRestorationMsg(result.message);
    if (result.success) {
      setStreak(result.newStreak ?? streak);
      const data = await getStreakData();
      setXp(data.totalXP);
      setCanRestore(false);
    }
    setTimeout(() => setRestorationMsg(""), 4000);
  };

  if (streak === null) return null;

  const milestone = getStreakMilestone(streak);

  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-6 top-20 z-[2000] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-black shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <div className="text-left">
            <div className="text-xs font-semibold opacity-90">Streak</div>
            <div className="text-sm font-bold">{streak}d</div>
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-96 rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-[#0b1329] to-[#071127] p-8 shadow-2xl"
            >
              <div className="mb-6 text-center">
                <h2 className="text-4xl font-bold text-white">
                  {milestone.emoji} {streak} Day Streak
                </h2>
                <p className="mt-2 text-cyan-300 font-semibold text-lg">
                  {milestone.level}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-xs text-slate-300 mb-2">
                  <span>Progress to {milestone.nextMilestone}d</span>
                  <span>{milestone.progress}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${milestone.progress}%` }}
                    transition={{ duration: 1 }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <p className="text-xs text-slate-300">Total XP</p>
                  <p className="mt-2 text-2xl font-bold text-cyan-300">{xp}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <p className="text-xs text-slate-300">Daily XP</p>
                  <p className="mt-2 text-2xl font-bold text-blue-300">+{dailyXP}</p>
                </div>
              </div>

              {milestone.reward && (
                <div className="mb-6 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-4">
                  <p className="text-sm text-yellow-300">
                    <span className="font-semibold">Reward:</span>{" "}
                    {milestone.reward}
                  </p>
                </div>
              )}

              {restorationMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-lg border border-green-400/30 bg-green-400/10 p-3 text-sm text-green-300 text-center"
                >
                  {restorationMsg}
                </motion.div>
              )}

              {!canRestore ? (
                <button
                  disabled
                  className="w-full rounded-lg bg-slate-600 py-2 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
                >
                  Restoration used today
                </button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRestore}
                  className="w-full rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 py-2 text-sm font-semibold text-black transition-all hover:shadow-lg"
                >
                  Restore Streak (100 XP)
                </motion.button>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="mt-4 w-full rounded-lg border border-white/20 py-2 text-sm font-semibold text-white transition-all hover:bg-white/5"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}