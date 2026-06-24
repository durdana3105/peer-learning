import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitReview, getUserReviews, getUserTrustMetrics } from "../controllers/reviewController.js";

// Mock Supabase admin client
const mockSupabase = {
  from: vi.fn(),
};

vi.mock("../utils/supabase.js", () => ({
  getSupabaseAdmin: () => mockSupabase,
}));

// Mock trust score calculations
const mockCalculateTrustMetrics = vi.fn();
vi.mock("../utils/trustScore.js", () => ({
  calculateTrustMetrics: (...args) => mockCalculateTrustMetrics(...args),
  calculateTrustScore: vi.fn(),
  calculateMentorBadge: vi.fn(),
}));

const mockQueryChain = (data, error = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn().mockImplementation((resolve) => resolve({ data, error })),
  };
  return chain;
};

describe("reviewController", () => {
  let req, res, next;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockCalculateTrustMetrics.mockReset();
    mockSupabase.from.mockReset();

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  describe("submitReview", () => {
    it("should submit review successfully (reviewer is learner reviewing mentor)", async () => {
      req = {
        user: { id: "learner-123" },
        body: {
          sessionId: "session-abc",
          rating: 5,
          tags: ["Knowledgeable", "Patient"],
          comment: "Great session!",
        },
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "sessions") {
          return mockQueryChain({
            id: "session-abc",
            status: "completed",
            mentor_id: "mentor-456",
            student_id: "learner-123",
          });
        }
        if (table === "session_participants") {
          return mockQueryChain({
            session_id: "session-abc",
            user_id: "learner-123",
          });
        }
        if (table === "session_reviews") {
          // Check for existing review (none found), then insert new review
          return mockQueryChain(null); // chain resolves null or data
        }
        return mockQueryChain({});
      });

      // Special mock chain for insert
      const insertMock = mockQueryChain({
        id: "review-789",
        session_id: "session-abc",
        reviewer_id: "learner-123",
        reviewee_id: "mentor-456",
        rating: 5,
        tags: ["Knowledgeable", "Patient"],
        comment: "Great session!",
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === "sessions") {
          return mockQueryChain({
            id: "session-abc",
            status: "completed",
            mentor_id: "mentor-456",
            student_id: "learner-123",
          });
        }
        if (table === "session_participants") {
          return mockQueryChain({
            session_id: "session-abc",
            user_id: "learner-123",
          });
        }
        if (table === "session_reviews") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: "review-789",
                    session_id: "session-abc",
                    reviewer_id: "learner-123",
                    reviewee_id: "mentor-456",
                    rating: 5,
                    tags: ["Knowledgeable", "Patient"],
                    comment: "Great session!",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return mockQueryChain({});
      });

      await submitReview(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Review submitted successfully",
        })
      );
      expect(mockCalculateTrustMetrics).toHaveBeenCalledWith("mentor-456");
    });

    it("should submit review successfully (reviewer is mentor reviewing learner)", async () => {
      req = {
        user: { id: "mentor-456" },
        body: {
          sessionId: "session-abc",
          rating: 4,
          tags: ["Friendly"],
          comment: "Learned quickly!",
        },
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "sessions") {
          return mockQueryChain({
            id: "session-abc",
            status: "ended",
            mentor_id: "mentor-456",
            student_id: "learner-123",
          });
        }
        if (table === "session_participants") {
          return mockQueryChain(null); // Mentor is not in session_participants
        }
        if (table === "session_reviews") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: "review-789",
                    session_id: "session-abc",
                    reviewer_id: "mentor-456",
                    reviewee_id: "learner-123",
                    rating: 4,
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return mockQueryChain({});
      });

      await submitReview(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockCalculateTrustMetrics).toHaveBeenCalledWith("learner-123");
    });

    it("should fail if session does not exist", async () => {
      req = {
        user: { id: "learner-123" },
        body: { sessionId: "missing-session", rating: 5 },
      };

      mockSupabase.from.mockReturnValue(mockQueryChain(null));

      await submitReview(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe("Session not found");
    });

    it("should fail if session status is not ended or completed", async () => {
      req = {
        user: { id: "learner-123" },
        body: { sessionId: "session-abc", rating: 5 },
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "sessions") {
          return mockQueryChain({
            id: "session-abc",
            status: "upcoming",
            mentor_id: "mentor-456",
            student_id: "learner-123",
          });
        }
        return mockQueryChain({});
      });

      await submitReview(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(400);
      expect(err.message).toContain("Cannot review a session with status: upcoming");
    });

    it("should fail if reviewer did not participate in the session", async () => {
      req = {
        user: { id: "stranger-999" },
        body: { sessionId: "session-abc", rating: 5 },
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "sessions") {
          return mockQueryChain({
            id: "session-abc",
            status: "completed",
            mentor_id: "mentor-456",
            student_id: "learner-123",
          });
        }
        if (table === "session_participants") {
          return mockQueryChain(null); // Not a participant
        }
        return mockQueryChain({});
      });

      await submitReview(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe("You did not participate in this session");
    });

    it("should fail if reviewer attempts self-review", async () => {
      req = {
        user: { id: "mentor-456" },
        body: { sessionId: "session-abc", rating: 5 },
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "sessions") {
          return mockQueryChain({
            id: "session-abc",
            status: "completed",
            mentor_id: "mentor-456",
            student_id: "mentor-456", // Mock self-session
          });
        }
        return mockQueryChain({});
      });

      await submitReview(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe("You cannot review yourself");
    });

    it("should fail if duplicate review is submitted", async () => {
      req = {
        user: { id: "learner-123" },
        body: { sessionId: "session-abc", rating: 5 },
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "sessions") {
          return mockQueryChain({
            id: "session-abc",
            status: "completed",
            mentor_id: "mentor-456",
            student_id: "learner-123",
          });
        }
        if (table === "session_participants") {
          return mockQueryChain({
            session_id: "session-abc",
            user_id: "learner-123",
          });
        }
        if (table === "session_reviews") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: { id: "existing-review-id" }, error: null }),
                }),
              }),
            }),
          };
        }
        return mockQueryChain({});
      });

      await submitReview(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe("You have already submitted a review for this session");
    });
  });

  describe("getUserReviews", () => {
    it("should fetch up to 20 recent reviews with reviewer details", async () => {
      req = {
        params: { id: "user-reviewee" },
      };

      const mockReviews = [
        { id: "r1", rating: 5, tags: ["Patient"], comment: "Nice!", created_at: "2026-06-12T00:00:00Z", reviewer_id: "rev1" },
      ];

      const mockProfiles = [
        { id: "rev1", name: "Alice", avatar_url: "alice-avatar.png" },
      ];

      mockSupabase.from.mockImplementation((table) => {
        if (table === "session_reviews") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: async () => ({ data: mockReviews, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: () => ({
              in: async () => ({ data: mockProfiles, error: null }),
            }),
          };
        }
        return mockQueryChain({});
      });

      await getUserReviews(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([
        {
          id: "r1",
          rating: 5,
          tags: ["Patient"],
          comment: "Nice!",
          created_at: "2026-06-12T00:00:00Z",
          reviewerName: "Alice",
          reviewerAvatar: "alice-avatar.png",
        },
      ]);
    });
  });

  describe("getUserTrustMetrics", () => {
    it("should return trust metrics for user", async () => {
      req = {
        params: { id: "user-123" },
      };

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                trust_score: 4.8,
                average_rating: 4.7,
                total_reviews: 12,
                positive_tags_count: 15,
                negative_tags_count: 1,
                mentor_badge: "Trusted Peer",
              },
              error: null,
            }),
          }),
        }),
      }));

      await getUserTrustMetrics(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        trustScore: 4.8,
        averageRating: 4.7,
        totalReviews: 12,
        positiveTagsCount: 15,
        negativeTagsCount: 1,
        mentorBadge: "Trusted Peer",
      });
    });

    it("should fail if profile not found", async () => {
      req = {
        params: { id: "unknown-user" },
      };

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }));

      await getUserTrustMetrics(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe("Profile not found");
    });
  });
});
