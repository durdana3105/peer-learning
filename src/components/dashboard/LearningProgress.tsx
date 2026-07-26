import { Target } from "lucide-react";
import { motion } from "framer-motion";

export default function LearningProgress() {
  const goals = [
    { name: "Frontend Development", progress: 80, color: "bg-cyan-400" },
    { name: "Backend Development", progress: 60, color: "bg-blue-500" },
    { name: "Open Source Contributions", progress: 75, color: "bg-purple-500" },
  ];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target size={20} className="text-pink-400" />
          Learning Goals
        </h3>
      </div>

      <div className="space-y-6 flex-1">
        {goals.map((goal, index) => (
          <div key={goal.name} className="group cursor-pointer">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                {goal.name}
              </span>
              <span className="text-sm font-bold text-slate-200">
                {goal.progress}%
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${goal.progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.2 }}
                className={`h-full rounded-full ${goal.color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}