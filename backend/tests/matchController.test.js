import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock ../utils/supabase.js so the controller's getSupabaseAdmin() call
// returns our controllable mock client on every invocation.
// This must be declared before any import of matchController.
// ---------------------------------------------------------------------------
const mockRpc = vi.fn();
const mockSingle = vi.fn();

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: mockSingle,
  })),
  rpc: mockRpc,
};

vi.mock("../utils/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(() => mockSupabase),
}));

// Import after mocks are in place
const { getRecommendedPartners } = await import("../controllers/matchController.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const createRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const CURRENT_USER_EMAIL = "alice@example.com";

const CURRENT_USER_PROFILE = {
  skills: ["JavaScript", "React"],
  interests: ["AI", "Open Source"],
  teach_subjects: ["React"],
  learn_subjects: ["Rust"],
};

const MATCHED_USERS_FROM_DB = [
  {
    id: "uuid-bob",
    name: "Bob",
    skills: ["JavaScript", "Node.js"],
    interests: ["AI"],
    teach_subjects: ["Rust"],
    learn_subjects: ["React"],
    compatibility_score: 36,
  },
  {
    id: "uuid-carol",
    name: "Carol",
    skills: ["Python"],
    interests: ["Open Source"],
    teach_subjects: [],
    learn_subjects: [],
    compatibility_score: 3,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("getRecommendedPartners", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default happy-path mocks
    mockSingle.mockResolvedValue({ data: CURRENT_USER_PROFILE, error: null });
    mockRpc.mockResolvedValue({ data: MATCHED_USERS_FROM_DB, error: null });

    // Reset from() to return the default chain each time
    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    }));
  });

  // -------------------------------------------------------------------------
  // Happy path: RPC called with correct arguments
  // -------------------------------------------------------------------------
  it("calls match_users RPC with the current user's profile data", async () => {
    const req = { user: { email: CURRENT_USER_EMAIL }, query: {} };
    const res = createRes();

    await getRecommendedPartners(req, res);

    expect(mockRpc).toHaveBeenCalledOnce();
    expect(mockRpc).toHaveBeenCalledWith(
      "match_users",
      expect.objectContaining({
        target_email: CURRENT_USER_EMAIL,
        target_skills: CURRENT_USER_PROFILE.skills,
        target_teach: CURRENT_USER_PROFILE.teach_subjects,
        target_learn: CURRENT_USER_PROFILE.learn_subjects,
        target_interests: CURRENT_USER_PROFILE.interests,
      })
    );
  });

  it("returns 200 with correctly shaped recommendations", async () => {
    const req = { user: { email: CURRENT_USER_EMAIL }, query: {} };
    const res = createRes();

    await getRecommendedPartners(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.recommendations).toHaveLength(2);
    const bob = body.recommendations[0];
    expect(bob._id).toBe("uuid-bob");
    expect(bob.compatibilityScore).toBe(36);
    expect(bob.reason).toBeTypeOf("string");
  });

  // -------------------------------------------------------------------------
  // Regression guard for #806
  // -------------------------------------------------------------------------
  it("RPC is called regardless of caller RLS context (regression guard for #806)", async () => {
    const restrictedProfile = {
      id: "uuid-restricted",
      name: "Restricted User",
      skills: ["React"],
      interests: [],
      teach_subjects: [],
      learn_subjects: [],
      compatibility_score: 10,
    };
    mockRpc.mockResolvedValueOnce({ data: [restrictedProfile], error: null });

    const req = { user: { email: CURRENT_USER_EMAIL }, query: {} };
    const res = createRes();

    await getRecommendedPartners(req, res);

    expect(mockRpc).toHaveBeenCalledWith("match_users", expect.any(Object));
    const body = res.json.mock.calls[0][0];
    expect(body.recommendations[0]._id).toBe("uuid-restricted");
  });

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  it("passes correct page_limit and page_offset to the RPC", async () => {
    const req = {
      user: { email: CURRENT_USER_EMAIL },
      query: { page: "3", limit: "5" },
    };
    const res = createRes();

    await getRecommendedPartners(req, res);

    expect(mockRpc).toHaveBeenCalledWith(
      "match_users",
      expect.objectContaining({
        page_limit: 5,
        page_offset: 10, // (3 - 1) * 5
      })
    );
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------
  it("returns 404 when current user profile is not found", async () => {
    // Override single() to simulate missing profile
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

    const req = { user: { email: CURRENT_USER_EMAIL }, query: {} };
    const res = createRes();

    await getRecommendedPartners(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].success).toBe(false);
  });

  it("returns 500 when the match_users RPC fails", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "DB error" } });

    const req = { user: { email: CURRENT_USER_EMAIL }, query: {} };
    const res = createRes();

    await getRecommendedPartners(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].success).toBe(false);
  });

  it("returns 200 with empty recommendations when RPC returns no rows", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    const req = { user: { email: CURRENT_USER_EMAIL }, query: {} };
    const res = createRes();

    await getRecommendedPartners(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].recommendations).toHaveLength(0);
  });
});