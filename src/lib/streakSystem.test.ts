import { describe, it, expect, vi } from "vitest";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import {
  calculateStreakXP,
  getStreakMilestone,
  getStreakAchievements,
} from "./streakSystem";

describe("Streak System Pure Utilities", () => {
  describe("calculateStreakXP", () => {
    it("should calculate correct XP for a short streak", () => {
      // baseXP 50 + streak * 10
      expect(calculateStreakXP(0)).toBe(50);
      expect(calculateStreakXP(1)).toBe(60);
      expect(calculateStreakXP(5)).toBe(100);
    });

    it("should cap the daily XP at the maximum of 200", () => {
      expect(calculateStreakXP(15)).toBe(200);
      expect(calculateStreakXP(50)).toBe(200);
    });
  });

  describe("getStreakMilestone", () => {
    it("should return Beginner milestone for streak < 7", () => {
      const milestone = getStreakMilestone(3);
      expect(milestone.level).toBe("Beginner");
      expect(milestone.nextMilestone).toBe(7);
      expect(milestone.progress).toBe(42); // Math.floor((3/7) * 100)
    });

    it("should return Rising Star milestone for 7 <= streak < 30", () => {
      const milestone = getStreakMilestone(15);
      expect(milestone.level).toBe("Rising Star");
      expect(milestone.nextMilestone).toBe(30);
      expect(milestone.progress).toBe(50); // Math.floor((15/30) * 100)
    });

    it("should return Legendary for streak >= 365", () => {
      const milestone = getStreakMilestone(400);
      expect(milestone.level).toBe("Legendary");
      expect(milestone.nextMilestone).toBe(730);
      expect(milestone.progress).toBe(100);
    });
  });

  describe("getStreakAchievements", () => {
    it("should return empty array for 0 streak", () => {
      expect(getStreakAchievements(0)).toEqual([]);
    });

    it("should return multiple achievements as streak grows", () => {
      const achievements = getStreakAchievements(8);
      expect(achievements).toContain("First Step 🌱");
      expect(achievements).toContain("3-Day Learner 📚");
      expect(achievements).toContain("Weekly Champion 🌟");
      expect(achievements).not.toContain("Fortnite Hero 💪");
    });

    it("should return all achievements for a legendary streak", () => {
      const achievements = getStreakAchievements(365);
      expect(achievements.length).toBe(7);
      expect(achievements).toContain("Legendary Guardian 🏆");
    });
  });
});
