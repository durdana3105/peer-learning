// src/utils/profileCompletion.test.ts
import { describe, it, expect } from "vitest";
import {
  calculateProfileCompletion,
  getCompletionTier,
  type UserProfile,
} from "./profileCompletion";

const emptyProfile: UserProfile = {};

const fullProfile: UserProfile = {
  avatar_url: "https://example.com/photo.jpg",
  display_name: "Payal Sharma",
  bio: "I love learning new things about AI and ML.",
  skills: ["Python", "Machine Learning", "React"],
  learning_preferences: ["visual", "hands-on"],
  github_url: "https://github.com/payal",
};

describe("calculateProfileCompletion", () => {
  it("returns 0% for an empty profile", () => {
    const result = calculateProfileCompletion(emptyProfile);
    expect(result.percentage).toBe(0);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toHaveLength(6);
  });

  it("returns 100% for a fully filled profile", () => {
    const result = calculateProfileCompletion(fullProfile);
    expect(result.percentage).toBe(100);
    expect(result.isComplete).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it("adds 15% for avatar_url", () => {
    const result = calculateProfileCompletion({ avatar_url: "https://x.com/img.png" });
    expect(result.percentage).toBe(15);
  });

  it("adds 10% for display_name", () => {
    const result = calculateProfileCompletion({ display_name: "Payal" });
    expect(result.percentage).toBe(10);
  });

  it("adds 20% for bio (must be >= 10 chars)", () => {
    const shortBio = calculateProfileCompletion({ bio: "Short" });
    expect(shortBio.percentage).toBe(0);

    const validBio = calculateProfileCompletion({ bio: "I love learning" });
    expect(validBio.percentage).toBe(20);
  });

  it("adds 25% for skills only when >= 3 skills present", () => {
    const twoSkills = calculateProfileCompletion({ skills: ["Python", "JS"] });
    expect(twoSkills.percentage).toBe(0);

    const threeSkills = calculateProfileCompletion({
      skills: ["Python", "JS", "React"],
    });
    expect(threeSkills.percentage).toBe(25);
  });

  it("adds 20% for learning_preferences when at least one is set", () => {
    const result = calculateProfileCompletion({
      learning_preferences: ["visual"],
    });
    expect(result.percentage).toBe(20);
  });

  it("adds 10% for social_link via github_url", () => {
    const result = calculateProfileCompletion({
      github_url: "https://github.com/payal",
    });
    expect(result.percentage).toBe(10);
  });

  it("adds 10% for social_link via social_url", () => {
    const result = calculateProfileCompletion({
      social_url: "https://linkedin.com/in/payal",
    });
    expect(result.percentage).toBe(10);
  });

  it("counts only github_url once even if both links provided", () => {
    const result = calculateProfileCompletion({
      github_url: "https://github.com/payal",
      social_url: "https://linkedin.com/in/payal",
    });
    expect(result.percentage).toBe(10);
  });

  it("returns correct missing fields", () => {
    const result = calculateProfileCompletion({
      display_name: "Payal",
      bio: "I love learning",
    });
    const missingKeys = result.missingFields.map((f) => f.key);
    expect(missingKeys).toContain("avatar_url");
    expect(missingKeys).toContain("skills");
    expect(missingKeys).toContain("learning_preferences");
    expect(missingKeys).toContain("social_link");
    expect(missingKeys).not.toContain("display_name");
    expect(missingKeys).not.toContain("bio");
  });

  it("edit paths include the base path and section hash", () => {
    const result = calculateProfileCompletion(emptyProfile, "/settings/profile");
    result.fields.forEach((f) => {
      expect(f.editPath).toMatch(/^\/settings\/profile#/);
    });
  });
});

describe("getCompletionTier", () => {
  it("returns 'low' for 0–40%", () => {
    expect(getCompletionTier(0)).toBe("low");
    expect(getCompletionTier(40)).toBe("low");
  });

  it("returns 'medium' for 41–79%", () => {
    expect(getCompletionTier(41)).toBe("medium");
    expect(getCompletionTier(79)).toBe("medium");
  });

  it("returns 'high' for 80–99%", () => {
    expect(getCompletionTier(80)).toBe("high");
    expect(getCompletionTier(99)).toBe("high");
  });

  it("returns 'complete' for 100%", () => {
    expect(getCompletionTier(100)).toBe("complete");
  });
});