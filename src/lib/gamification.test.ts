import { describe, it, expect } from "vitest";
import {
  calculateLevel,
  calculateProgress,
  getBadgeByXP,
  getAchievements,
  getXPForActivity,
  isAchievementUnlocked,
  ALL_ACHIEVEMENTS,
  type AchievementStats,
} from "./gamification";

const baseStats = (overrides: Partial<AchievementStats> = {}): AchievementStats => ({
  totalXP: 0,
  streak: 0,
  activityCounts: {},
  rank: null,
  ...overrides,
});

describe("Gamification Utility Functions", () => {
  describe("calculateLevel", () => {
    it("should return level 1 for 0 XP", () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it("should return level 2 for 100 XP", () => {
      expect(calculateLevel(100)).toBe(2);
    });

    it("should correctly handle arbitrary XP values", () => {
      expect(calculateLevel(250)).toBe(3);
      expect(calculateLevel(999)).toBe(10);
    });
  });

  describe("calculateProgress", () => {
    it("should return correct progress for the current level", () => {
      expect(calculateProgress(0)).toBe(0);
      expect(calculateProgress(50)).toBe(50);
      expect(calculateProgress(100)).toBe(0);
      expect(calculateProgress(275)).toBe(75);
    });
  });

  describe("getBadgeByXP", () => {
    it("should return Beginner for 0 XP", () => {
      expect(getBadgeByXP(0)).toBe("🌱 Beginner");
    });

    it("should return Intermediate for 200 XP", () => {
      expect(getBadgeByXP(200)).toBe("🚀 Intermediate");
      expect(getBadgeByXP(499)).toBe("🚀 Intermediate");
    });

    it("should return Grandmaster for 5000+ XP", () => {
      expect(getBadgeByXP(5000)).toBe("🏆 Grandmaster");
      expect(getBadgeByXP(10000)).toBe("🏆 Grandmaster");
    });
  });

  describe("isAchievementUnlocked", () => {
    it("unlocks XP badges from totalXP alone", () => {
      const firstSteps = ALL_ACHIEVEMENTS.find((a) => a.id === "first_steps")!;
      expect(isAchievementUnlocked(firstSteps, baseStats({ totalXP: 49 }))).toBe(false);
      expect(isAchievementUnlocked(firstSteps, baseStats({ totalXP: 50 }))).toBe(true);
    });

    it("does not unlock activity badges from XP alone", () => {
      const activeLearner = ALL_ACHIEVEMENTS.find((a) => a.id === "active_learner")!;
      const sessionHost = ALL_ACHIEVEMENTS.find((a) => a.id === "session_host")!;
      const communityMentor = ALL_ACHIEVEMENTS.find((a) => a.id === "community_mentor")!;

      const highXpNoActivity = baseStats({ totalXP: 5000 });
      expect(isAchievementUnlocked(activeLearner, highXpNoActivity)).toBe(false);
      expect(isAchievementUnlocked(sessionHost, highXpNoActivity)).toBe(false);
      expect(isAchievementUnlocked(communityMentor, highXpNoActivity)).toBe(false);
    });

    it("unlocks activity badges when the required activity count is met", () => {
      const activeLearner = ALL_ACHIEVEMENTS.find((a) => a.id === "active_learner")!;
      const sessionHost = ALL_ACHIEVEMENTS.find((a) => a.id === "session_host")!;

      expect(
        isAchievementUnlocked(
          activeLearner,
          baseStats({ activityCounts: { session_join: 1 } })
        )
      ).toBe(true);

      expect(
        isAchievementUnlocked(
          sessionHost,
          baseStats({ activityCounts: { host_session: 1 } })
        )
      ).toBe(false);

      expect(
        isAchievementUnlocked(
          sessionHost,
          baseStats({ activityCounts: { host_session: 2 } })
        )
      ).toBe(true);
    });
  });

  describe("getAchievements", () => {
    it("should return no achievements if below 50 XP and without activity", () => {
      expect(getAchievements(baseStats({ totalXP: 49 }))).toEqual([]);
    });

    it("should return First Steps for 50 XP", () => {
      expect(getAchievements(baseStats({ totalXP: 50 }))).toEqual(["First Steps"]);
    });

    it("should require activity for Active Learner even with high XP", () => {
      const achievements = getAchievements(baseStats({ totalXP: 550 }));
      expect(achievements).toContain("First Steps");
      expect(achievements).not.toContain("Active Learner");
      expect(achievements).not.toContain("Knowledge Explorer");
    });
  });

  describe("getXPForActivity", () => {
    it("should return correct XP for known activities", () => {
      expect(getXPForActivity("host_session")).toBe(50);
      expect(getXPForActivity("session_join")).toBe(50);
      expect(getXPForActivity("mentor_help")).toBe(100);
      expect(getXPForActivity("daily_login")).toBe(20);
      expect(getXPForActivity("resource_upload")).toBe(20);
      expect(getXPForActivity("chat_message")).toBe(5);
    });

    it("should return default XP for unknown activities", () => {
      expect(getXPForActivity("unknown_activity")).toBe(10);
    });
  });
});
