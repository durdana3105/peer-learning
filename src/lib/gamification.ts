export const calculateLevel = (xp: number) => {
  return Math.floor(xp / 100) + 1;
};

export const calculateProgress = (xp: number) => {
  return xp % 100;
};

export const ALL_BADGES = [
  { id: "beginner", name: "🌱 Beginner", xpRequired: 0, description: "Started your journey" },
  { id: "intermediate", name: "🚀 Intermediate", xpRequired: 200, description: "Earned 200 XP" },
  { id: "expert", name: "⭐ Expert", xpRequired: 500, description: "Earned 500 XP" },
  { id: "master", name: "🔥 Master", xpRequired: 1000, description: "Earned 1000 XP" },
  { id: "legend", name: "👑 Legend", xpRequired: 2000, description: "Earned 2000 XP" },
  { id: "grandmaster", name: "🏆 Grandmaster", xpRequired: 5000, description: "Earned 5000 XP" },
];

export type AchievementCriterion =
  | { type: "xp"; min: number }
  | { type: "streak"; min: number }
  | { type: "activity"; activity: string; min: number }
  | { type: "rank"; max: number };

export type Achievement = {
  id: string;
  name: string;
  /** Soft XP hint for UI only; unlock is driven by `criteria`. */
  xpRequired: number;
  icon: string;
  description: string;
  criteria: AchievementCriterion;
};

export type AchievementStats = {
  totalXP: number;
  streak: number;
  activityCounts: Record<string, number>;
  rank: number | null;
};

export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_steps",
    name: "First Steps",
    xpRequired: 50,
    icon: "👣",
    description: "Earned your first 50 XP",
    criteria: { type: "xp", min: 50 },
  },
  {
    id: "active_learner",
    name: "Active Learner",
    xpRequired: 200,
    icon: "📚",
    description: "Participated in sessions",
    criteria: { type: "activity", activity: "session_join", min: 1 },
  },
  {
    id: "knowledge_explorer",
    name: "Knowledge Explorer",
    xpRequired: 500,
    icon: "🧭",
    description: "Maintained a 7-day learning streak",
    criteria: { type: "streak", min: 7 },
  },
  {
    id: "consistency_king",
    name: "Consistency King",
    xpRequired: 750,
    icon: "👑",
    description: "Maintained a 14-day learning streak",
    criteria: { type: "streak", min: 14 },
  },
  {
    id: "community_mentor",
    name: "Community Mentor",
    xpRequired: 1000,
    icon: "🤝",
    description: "Helped others grow",
    criteria: { type: "activity", activity: "mentor_help", min: 1 },
  },
  {
    id: "session_host",
    name: "Session Host",
    xpRequired: 1500,
    icon: "🎙️",
    description: "Hosted multiple sessions",
    criteria: { type: "activity", activity: "host_session", min: 2 },
  },
  {
    id: "top_mentor",
    name: "Top Mentor",
    xpRequired: 2500,
    icon: "🥇",
    description: "Hosted five or more mentorship sessions",
    criteria: { type: "activity", activity: "host_session", min: 5 },
  },
  {
    id: "top_contributor",
    name: "Top 10 Contributor",
    xpRequired: 3000,
    icon: "🌟",
    description: "Reached the top 10",
    criteria: { type: "rank", max: 10 },
  },
];

export const isAchievementUnlocked = (
  achievement: Achievement,
  stats: AchievementStats
): boolean => {
  const { criteria } = achievement;

  switch (criteria.type) {
    case "xp":
      return stats.totalXP >= criteria.min;
    case "streak":
      return stats.streak >= criteria.min;
    case "activity":
      return (stats.activityCounts[criteria.activity] ?? 0) >= criteria.min;
    case "rank":
      return stats.rank != null && stats.rank > 0 && stats.rank <= criteria.max;
    default:
      return false;
  }
};

export const getBadgeByXP = (xp: number) => {
  // Return highest achieved badge string for backwards compatibility, or empty string if none.
  const earned = ALL_BADGES.filter(b => xp >= b.xpRequired).reverse();
  return earned.length > 0 ? earned[0].name : "🌱 Beginner";
};

export const getAchievements = (stats: AchievementStats) => {
  return ALL_ACHIEVEMENTS.filter((a) => isAchievementUnlocked(a, stats)).map((a) => a.name);
};

export const getXPForActivity = (activity: string) => {
  switch (activity) {
    case "host_session":
      return 50;

    case "session_join":
      return 50;

    case "mentor_help":
      return 100;

    case "daily_login":
      return 20;

    case "resource_upload":
      return 20;

    case "chat_message":
      return 5;

    default:
      return 10;
  }
};
