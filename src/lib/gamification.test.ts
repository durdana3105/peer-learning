import { describe, it, expect } from "vitest";
import {
  calculateLevel,
  calculateProgress,
  getBadgeByXP,
  getAchievements,
  getXPForActivity,
} from "./gamification";

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

  describe("getAchievements", () => {
    it("should return no achievements if below 50 XP", () => {
      expect(getAchievements(49)).toEqual([]);
    });

    it("should return First Steps for 50 XP", () => {
      expect(getAchievements(50)).toEqual(["First Steps"]);
    });

    it("should return multiple achievements as XP grows", () => {
      const achievements = getAchievements(550);
      expect(achievements).toContain("First Steps");
      expect(achievements).toContain("Active Learner");
      expect(achievements).toContain("Knowledge Explorer");
      expect(achievements).not.toContain("Consistency King");
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
