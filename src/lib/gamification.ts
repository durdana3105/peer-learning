export const calculateLevel = (xp: number) => {
  return Math.floor(xp / 100) + 1;
};

export const calculateProgress = (xp: number) => {
  return xp % 100;
};

export const getBadgeByXP = (xp: number) => {
  if (xp >= 5000) return "🏆 Grandmaster";
  if (xp >= 2000) return "👑 Legend";
  if (xp >= 1000) return "🔥 Master";
  if (xp >= 500) return "⭐ Expert";
  if (xp >= 200) return "🚀 Intermediate";
  return "🌱 Beginner";
};

export const getAchievements = (xp: number) => {
  const achievements = [];

  if (xp >= 50) achievements.push("First Steps");
  if (xp >= 200) achievements.push("Active Learner");
  if (xp >= 500) achievements.push("Knowledge Explorer");
  if (xp >= 1000) achievements.push("Community Mentor");

  return achievements;
};

export const getXPForActivity = (activity: string) => {
  switch (activity) {
    case "session_join":
      return 50;

    case "mentor_help":
      return 100;

    case "daily_login":
      return 20;

    default:
      return 10;
  }
};
