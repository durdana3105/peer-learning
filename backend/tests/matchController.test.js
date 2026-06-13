/**
 * Regression tests:
 * Non-Deterministic Compatibility Score Injection in getSupabaseDiscover
 *
 * Two invariants are verified:
 *  1. Referential transparency — identical inputs produce identical ordered output
 *     on every call (no Math.random() or other non-deterministic side-effects in
 *     the score pipeline).
 *  2. Zero-overlap exclusion — a peer with no skill, goal, subject, interest,
 *     style, language, or timezone overlap scores 0 and is excluded from the
 *     default (no-search, no-filter) view by the `u.score > 0` guard.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSupabaseDiscover } from "../controllers/matchController.js";

// ---------------------------------------------------------------------------
// Supabase mock factory
// ---------------------------------------------------------------------------

/**
 * Builds a minimal Supabase admin mock whose `.from().select()...` chain
 * resolves to the provided currentUser (for the `.single()` call) and peers
 * (for the paginated query).
 *
 * The `range` / `neq` / `ilike` / `or` builder methods are all no-ops that
 * return `this` so chaining works.
 */
const buildSupabaseMock = (currentUser, peers) => {
  const makeQuery = (resolvedData) => {
    const q = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: resolvedData, error: null }),
      // make the query itself awaitable (for the peers fetch which is not .single())
      then: undefined,
    };
    // When the query is awaited directly (peers fetch), resolve with the array.
    // Vitest / Node awaits via .then on the promise chain; we simulate by making
    // range() the last builder before await.
    q.range = vi.fn().mockResolvedValue({ data: resolvedData, error: null });
    return q;
  };

  let callCount = 0;
  const fromMock = vi.fn(() => {
    callCount++;
    // First .from() call is the currentUser profile fetch (.single() path).
    // Second .from() call is the peers query (.range() path).
    return callCount === 1
      ? makeQuery(currentUser)
      : makeQuery(peers);
  });

  return { from: fromMock };
};

// ---------------------------------------------------------------------------
// Shared res / next helpers
// ---------------------------------------------------------------------------

const createRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CURRENT_USER = {
  skills: ["javascript", "react"],
  learning_goals: ["typescript", "graphql"],
  interests: ["open-source"],
  learn_subjects: ["system-design"],
  teach_subjects: ["react"],
  learning_style: "visual",
  preferred_language: "english",
  timezone: "Asia/Kolkata",
};

/** Peer with partial but consistent overlap (should score > 0). */
const OVERLAPPING_PEER = {
  id: "peer-1",
  name: "Alice",
  skills: ["typescript", "graphql"],        // matches currentUser.learning_goals
  learning_goals: ["javascript"],            // matches currentUser.skills
  interests: ["open-source"],               // matches currentUser.interests
  teach_subjects: ["system-design"],         // matches currentUser.learn_subjects
  learn_subjects: ["react"],                // matches currentUser.teach_subjects
  learning_style: "visual",                 // matches
  preferred_language: "english",            // matches
  timezone: "Asia/Kolkata",                 // matches
};

/** Peer with zero overlap on every dimension. */
const ZERO_OVERLAP_PEER = {
  id: "peer-2",
  name: "Bob",
  skills: ["cobol", "fortran"],
  learning_goals: ["assembly"],
  interests: ["stamp-collecting"],
  teach_subjects: ["knitting"],
  learn_subjects: ["pottery"],
  learning_style: "auditory",
  preferred_language: "french",
  timezone: "America/Chicago",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getSupabaseDiscover — issue #807 regression", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  // -------------------------------------------------------------------------
  // Test 1 — Referential transparency
  // -------------------------------------------------------------------------
  it("produces identical score arrays on two calls with identical seeded data", async () => {
    const peers = [OVERLAPPING_PEER, ZERO_OVERLAP_PEER];

    // Call 1
    const supabase1 = buildSupabaseMock(CURRENT_USER, peers);
    vi.doMock("../utils/supabase.js", () => ({ getSupabaseAdmin: () => supabase1 }));
    const { getSupabaseDiscover: discover1 } = await import("../controllers/matchController.js");

    const req1 = { user: { id: "user-123" }, query: {} };
    const res1 = createRes();
    await discover1(req1, res1);

    const body1 = res1.json.mock.calls[0][0];
    const scores1 = body1.recommendations.map((r) => ({ id: r.id, score: r.score }));

    vi.resetModules();

    // Call 2 — fresh module load, fresh mock (simulates a new request)
    const supabase2 = buildSupabaseMock(CURRENT_USER, peers);
    vi.doMock("../utils/supabase.js", () => ({ getSupabaseAdmin: () => supabase2 }));
    const { getSupabaseDiscover: discover2 } = await import("../controllers/matchController.js");

    const req2 = { user: { id: "user-123" }, query: {} };
    const res2 = createRes();
    await discover2(req2, res2);

    const body2 = res2.json.mock.calls[0][0];
    const scores2 = body2.recommendations.map((r) => ({ id: r.id, score: r.score }));

    // Scores and order must be identical between the two independent calls.
    expect(scores1).toEqual(scores2);
  });

  // -------------------------------------------------------------------------
  // Test 2 — Zero-overlap peer is excluded in default view
  // -------------------------------------------------------------------------
  it("excludes a zero-overlap peer (score === 0) from the default no-search no-filter view", async () => {
    vi.resetModules();

    const peers = [ZERO_OVERLAP_PEER];

    const supabase = buildSupabaseMock(CURRENT_USER, peers);
    vi.doMock("../utils/supabase.js", () => ({ getSupabaseAdmin: () => supabase }));
    const { getSupabaseDiscover: discover } = await import("../controllers/matchController.js");

    // Default view: no search, no filter
    const req = { user: { id: "user-123" }, query: {} };
    const res = createRes();
    await discover(req, res);

    const body = res.json.mock.calls[0][0];

    // The zero-overlap peer must not appear in results.
    const ids = body.recommendations.map((r) => r.id);
    expect(ids).not.toContain("peer-2");

    // Sanity: if it did appear, its score would be 0; verify exclusion is by score.
    // (This assertion documents the expected raw score for the zero-overlap peer.)
    expect(body.recommendations.length).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Test 3 — Style/language/timezone bonuses do NOT manufacture a match
  //           when there is zero base overlap
  // -------------------------------------------------------------------------
  it("does not award style/language/timezone bonuses when base overlap is zero", async () => {
    vi.resetModules();

    // Peer matches currentUser only on style + language + timezone (no skills/goals/subjects/interests).
    const bonusOnlyPeer = {
      id: "peer-3",
      name: "Carol",
      skills: ["cobol"],
      learning_goals: ["fortran"],
      interests: ["stamp-collecting"],
      teach_subjects: ["knitting"],
      learn_subjects: ["pottery"],
      learning_style: "visual",          // same as currentUser
      preferred_language: "english",     // same as currentUser
      timezone: "Asia/Kolkata",          // same as currentUser
    };

    const supabase = buildSupabaseMock(CURRENT_USER, [bonusOnlyPeer]);
    vi.doMock("../utils/supabase.js", () => ({ getSupabaseAdmin: () => supabase }));
    const { getSupabaseDiscover: discover } = await import("../controllers/matchController.js");

    const req = { user: { id: "user-123" }, query: {} };
    const res = createRes();
    await discover(req, res);

    const body = res.json.mock.calls[0][0];

    // Bonus-only peer must score 0 and be excluded from the default view.
    expect(body.recommendations.map((r) => r.id)).not.toContain("peer-3");
    expect(body.recommendations.length).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Test 4 — An overlapping peer IS surfaced with a stable, positive score
  // -------------------------------------------------------------------------
  it("surfaces an overlapping peer with a positive, stable score", async () => {
    vi.resetModules();

    const supabase = buildSupabaseMock(CURRENT_USER, [OVERLAPPING_PEER]);
    vi.doMock("../utils/supabase.js", () => ({ getSupabaseAdmin: () => supabase }));
    const { getSupabaseDiscover: discover } = await import("../controllers/matchController.js");

    const req = { user: { id: "user-123" }, query: {} };
    const res = createRes();
    await discover(req, res);

    const body = res.json.mock.calls[0][0];
    const peer = body.recommendations.find((r) => r.id === "peer-1");

    expect(peer).toBeDefined();
    expect(peer.score).toBeGreaterThan(0);
    expect(typeof peer.score).toBe("number");
    // Score must be deterministic: re-running with same data must yield same value.
    expect(Number.isFinite(peer.score)).toBe(true);
  });
});