import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRecommendedPartners } from "../controllers/matchController.js";

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
// Supabase client mock
// ---------------------------------------------------------------------------

vi.mock("@supabase/supabase-js", () => {
  const makeMockClient = vi.fn();
  return { createClient: makeMockClient };
});

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
  let createClient;
  let mockSupabase;
  let mockFrom;
  let mockRpc;

  beforeEach(async () => {
    vi.restoreAllMocks();

    // Reset the module registry so the singleton supabaseAdminClient inside
    // supabase.js is cleared between tests.
    vi.resetModules();

    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-test";

    ({ createClient } = await import("@supabase/supabase-js"));

    // .from(...).select(...).eq(...).single() chain for current-user fetch
    const singleChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: CURRENT_USER_PROFILE,
        error: null,
      }),
    };

    mockRpc = vi.fn().mockResolvedValue({
      data: MATCHED_USERS_FROM_DB,
      error: null,
    });

    mockFrom = vi.fn().mockReturnValue(singleChain);

    mockSupabase = {
      from: mockFrom,
      rpc: mockRpc,
    };

    createClient.mockReturnValue(mockSupabase);
  });

  // -------------------------------------------------------------------------
  // Happy-path: RPC is called with correct arguments
  // -------------------------------------------------------------------------

  it("calls match_users RPC with the current user's profile data", async () => {
    const req = {
      user: { email: CURRENT_USER_EMAIL },
      query: {},
    };
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
    expect(bob.compatibilityScore).toBe(36); // trusts DB score
    expect(bob.reason).toBeTypeOf("string");
  });

  // -------------------------------------------------------------------------
  // Core bug regression: RPC must be invoked even when an RLS-restricted
  // profile would have been silently dropped in the non-SECURITY DEFINER path.
  //
  // This test simulates a "restricted" profile (e.g. future privacy controls)
  // that would return 0 rows to an authenticated caller but SHOULD appear in
  // results when the function runs as the definer role. We verify the RPC is
  // called at all — whether the DB-side fix is present is confirmed by the
  // migration, but we lock in the call contract so regressions are caught.
  // -------------------------------------------------------------------------

  it("RPC is called regardless of caller RLS context (regression guard for #806)", async () => {
    // Simulate a scenario where the restricted profile IS returned by the RPC
    // (as it would be with SECURITY DEFINER) but would have been dropped without it.
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

    // The RPC must have been called — not short-circuited by a direct table query
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
        page_offset: 10, // (3-1) * 5
      })
    );
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  it("returns 404 when current user profile is not found", async () => {
    const brokenChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
    };
    mockFrom.mockReturnValue(brokenChain);

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

  it("returns empty recommendations when RPC returns no rows", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    const req = { user: { email: CURRENT_USER_EMAIL }, query: {} };
    const res = createRes();

    await getRecommendedPartners(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].recommendations).toHaveLength(0);
  });
});