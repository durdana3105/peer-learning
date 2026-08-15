import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

type Goal = {
  name: string;
  progress: number;
  color: string;
};

const COLOR_PALETTE = [
  "bg-cyan-400",
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
];

const parseLearningGoalsText = (value: string | null | undefined): string[] => {
  if (!value?.trim()) return [];
  return value
    .split(/[\n,;|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
};

const clampProgress = (completed: number, goal: number): number => {
  if (!Number.isFinite(completed) || !Number.isFinite(goal) || goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((completed / goal) * 100)));
};

export default function LearningProgress() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchGoals = async () => {
      if (!user) {
        if (mounted) {
          setGoals([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [profileResult, portfolioResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("learn_subjects, learning_goals")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("portfolio_profiles")
            .select("learning_progress")
            .eq("profile_id", user.id)
            .maybeSingle(),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (portfolioResult.error) throw portfolioResult.error;

        const learnSubjects = Array.isArray(profileResult.data?.learn_subjects)
          ? profileResult.data.learn_subjects.filter(
              (item: unknown): item is string =>
                typeof item === "string" && item.trim().length > 0
            )
          : [];

        const textGoals = parseLearningGoalsText(
          profileResult.data?.learning_goals as string | null | undefined
        );

        const progressRaw = portfolioResult.data?.learning_progress as
          | { focus?: string; completed?: number; goal?: number }
          | null
          | undefined;

        const focus = progressRaw?.focus?.trim() || "";
        const focusProgress = clampProgress(
          Number(progressRaw?.completed ?? 0),
          Number(progressRaw?.goal ?? 0)
        );

        const names: string[] = [];
        for (const name of [...learnSubjects, ...textGoals]) {
          const trimmed = name.trim();
          if (
            trimmed &&
            !names.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())
          ) {
            names.push(trimmed);
          }
        }

        if (
          focus &&
          !names.some((existing) => existing.toLowerCase() === focus.toLowerCase())
        ) {
          names.push(focus);
        }

        if (!mounted) return;

        setGoals(
          names.map((name, index) => ({
            name,
            progress:
              focus && name.toLowerCase() === focus.toLowerCase() ? focusProgress : 0,
            color: COLOR_PALETTE[index % COLOR_PALETTE.length],
          }))
        );
      } catch (err) {
        console.error("Failed to fetch learning goals:", err);
        if (mounted) {
          setGoals([]);
          setError("Couldn't load your learning goals.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchGoals();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Target size={20} className="text-pink-400" />
          Learning Goals
        </h3>
      </div>

      <div className="space-y-6 flex-1">
        {loading && (
          <p className="text-sm text-slate-400 py-6 text-center">Loading goals…</p>
        )}

        {!loading && error && (
          <p className="text-sm text-rose-300 py-6 text-center">{error}</p>
        )}

        {!loading && !error && goals.length === 0 && (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-slate-400">
              No learning goals yet. Add subjects you want to learn to get started.
            </p>
            <Link
              to="/edit-profile"
              className="inline-flex text-sm text-cyan-400 hover:text-cyan-300"
            >
              Set up your goals
            </Link>
          </div>
        )}

        {!loading &&
          !error &&
          goals.map((goal, index) => (
            <div key={goal.name} className="group">
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
