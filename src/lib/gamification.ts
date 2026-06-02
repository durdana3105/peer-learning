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

export const ALL_ACHIEVEMENTS = [
  { id: "first_steps", name: "First Steps", xpRequired: 50, icon: "👣", description: "Earned your first 50 XP" },
  { id: "active_learner", name: "Active Learner", xpRequired: 200, icon: "📚", description: "Participated in sessions" },
  { id: "knowledge_explorer", name: "Knowledge Explorer", xpRequired: 500, icon: "🧭", description: "Consistently learning" },
  { id: "consistency_king", name: "Consistency King", xpRequired: 750, icon: "👑", description: "Earned for high activity" },
  { id: "community_mentor", name: "Community Mentor", xpRequired: 1000, icon: "🤝", description: "Helped others grow" },
  { id: "session_host", name: "Session Host", xpRequired: 1500, icon: "🎙️", description: "Hosted multiple sessions" },
  { id: "top_mentor", name: "Top Mentor", xpRequired: 2500, icon: "🥇", description: "Outstanding guidance" },
  { id: "top_contributor", name: "Top 10 Contributor", xpRequired: 3000, icon: "🌟", description: "Reached the top 10" },
];

export const getBadgeByXP = (xp: number) => {
  // Return highest achieved badge string for backwards compatibility, or empty string if none.
  const earned = ALL_BADGES.filter(b => xp >= b.xpRequired).reverse();
  return earned.length > 0 ? earned[0].name : "🌱 Beginner";
};

export const getAchievements = (xp: number) => {
  // Return array of strings for backwards compatibility.
  return ALL_ACHIEVEMENTS.filter(a => xp >= a.xpRequired).map(a => a.name);
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
