import { describe, it, expect } from "vitest";
import { calculateMentorBadge } from "../utils/trustScore.js";

describe("calculateMentorBadge", () => {
  it("should assign Top Mentor badge for high scores and high review counts", () => {
    expect(calculateMentorBadge(4.5, 20)).toBe("Top Mentor");
    expect(calculateMentorBadge(4.7, 25)).toBe("Top Mentor");
  });

  it("should assign Trusted Peer badge for appropriate scores and review counts", () => {
    expect(calculateMentorBadge(4.0, 10)).toBe("Trusted Peer");
    expect(calculateMentorBadge(4.4, 15)).toBe("Trusted Peer");
    // Should not assign Top Mentor because totalReviews is less than 20
    expect(calculateMentorBadge(4.8, 19)).toBe("Trusted Peer");
  });

  it("should assign Rising Mentor badge for appropriate scores and review counts", () => {
    expect(calculateMentorBadge(4.0, 5)).toBe("Rising Mentor");
    expect(calculateMentorBadge(4.3, 9)).toBe("Rising Mentor");
    // Should not assign Trusted Peer because totalReviews is less than 10
    expect(calculateMentorBadge(4.6, 9)).toBe("Rising Mentor");
  });

  it("should return null if trustScore or totalReviews criteria are not met", () => {
    // Score too low
    expect(calculateMentorBadge(3.9, 25)).toBeNull();
    // Reviews count too low
    expect(calculateMentorBadge(4.5, 4)).toBeNull();
    expect(calculateMentorBadge(3.5, 1)).toBeNull();
    expect(calculateMentorBadge(0, 0)).toBeNull();
  });
});
