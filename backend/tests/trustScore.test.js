import { describe, it, expect } from "vitest";
import { calculateTrustScore } from "../utils/trustScore.js";

describe("calculateTrustScore", () => {
  it("should return 0 when totalReviews is 0", () => {
    expect(calculateTrustScore([])).toBe(0);
  });

  it("should calculate correct trust score with a single new review", () => {
    // 1 review of rating 5, created now.
    // weight = e^(0) = 1.
    // weightedScore = 5.
    // confidenceFactor = min(1/10, 1) = 0.1.
    // trustScore = 5 * 0.1 = 0.5.
    const reviews = [
      { rating: 5, created_at: new Date().toISOString() }
    ];
    expect(calculateTrustScore(reviews)).toBe(0.5);
  });

  it("should calculate correct trust score with 10 reviews", () => {
    // 10 reviews of rating 5, created now.
    // weight = 1 for each.
    // weightedScore = 5.
    // confidenceFactor = min(10/10, 1) = 1.
    // trustScore = 5 * 1 = 5.0.
    const reviews = Array.from({ length: 10 }, () => ({
      rating: 5,
      created_at: new Date().toISOString()
    }));
    expect(calculateTrustScore(reviews)).toBe(5.0);
  });

  it("should calculate correct trust score with 15 reviews", () => {
    // 15 reviews of rating 4, created now.
    // weight = 1 for each.
    // weightedScore = 4.
    // confidenceFactor = min(15/10, 1) = 1.
    // trustScore = 4 * 1 = 4.0.
    const reviews = Array.from({ length: 15 }, () => ({
      rating: 4,
      created_at: new Date().toISOString()
    }));
    expect(calculateTrustScore(reviews)).toBe(4.0);
  });

  it("should apply age decay weight correctly", () => {
    // 1 review of rating 5 created 90 days ago.
    // weight = e^(-90/90) = e^(-1) ~ 0.367879.
    // 1 review of rating 1 created now.
    // weight = e^(0) = 1.
    // weightedScore = (5 * e^(-1) + 1 * 1) / (e^(-1) + 1)
    // = (5 * 0.367879 + 1) / (0.367879 + 1)
    // = (1.839397 + 1) / 1.367879
    // = 2.839397 / 1.367879 ~ 2.0757.
    // confidenceFactor = min(2/10, 1) = 0.2.
    // trustScore = 2.0757 * 0.2 = 0.4151.
    // Rounded to 1 decimal place: 0.4.
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const reviews = [
      { rating: 5, created_at: ninetyDaysAgo.toISOString() },
      { rating: 1, created_at: new Date().toISOString() }
    ];

    expect(calculateTrustScore(reviews)).toBe(0.4);
  });

  it("should clamp trust score between 0 and 5", () => {
    // Clamping is naturally handled by the math, but let's verify edge cases.
    const reviews = [
      { rating: 5, created_at: new Date().toISOString() }
    ];
    // trustScore is 0.5. Clamping should keep it 0.5.
    expect(calculateTrustScore(reviews)).toBe(0.5);

    // Negative ratings should not exist, but if somehow rating was 0:
    const zeroRatingReviews = [
      { rating: 0, created_at: new Date().toISOString() }
    ];
    expect(calculateTrustScore(zeroRatingReviews)).toBe(0);
  });
});
