import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Supabase mock ──────────────────────────────────────────────────────────────────
const mockRange = vi.fn().mockReturnThis();
const mockNeq = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSingle = vi.fn();
const mockOr = vi.fn().mockReturnThis();
const mockIlike = vi.fn().mockReturnThis();

// Final resolution — returns data from the query chain
const mockQueryResult = vi.fn();

const makeFromChain = () => ({
  select: mockSelect,
  eq: mockEq,
  neq: mockNeq,
  single: mockSingle,
  range: vi.fn().mockImplementation(() => ({
    or: mockOr,
    ilike: mockIlike,
    // resolves the Supabase query
    then: (resolve) => resolve(mockQueryResult()),
  })),
  or: mockOr,
});

const mockSupabase = {
  from: vi.fn(() => makeFromChain()),
};

vi.mock("../utils/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(() => mockSupabase),
}));

const { getSupabaseDiscover } = await import("../controllers/matchController.js");

// ── Helpers ────────────────────────────────────────────────────────────────────────
const createRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const CURRENT_USER_ID = "user-discover-test";

const PEER_PROFILES = [
  {
    id: "uuid-peer-1",
    name: "Alice",
    skills: ["Python"],
    interests: ["AI"],
    learning_goals: [],
    teach_subjects: ["Python"],
    learn_subjects: ["React"],
    learning_style: "visual",
    preferred_language: "English",
    timezone: "UTC",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase.from.mockImplementation(() => makeFromChain());
});

// ── Schema validation layer ────────────────────────────────────────────────────────
// These tests drive the endpoint through Express+Zod to confirm HTTP 400 is
// returned before the controller executes — matching the pattern in validation.test.js.
import express from "express";
import request from "supertest";
import cookieParser from "cookie-parser";
import { validate } from "../middlewares/validate.js";
import { matchSchemas } from "../validation/schemas.js";
import { errorHandler } from "../middlewares/errorHandler.js";

let app;

// Minimal app that applies only the validation middleware + controller
// (no requireAuth — we're testing the schema layer, not auth)
app = express();
app.use(cookieParser());
app.use(express.json());
app.get(
  "/api/match/supabase-discover",
  validate(matchSchemas.getSupabaseDiscover),
  async (req, res, next) => {
    try {
      // Inject a fake user so the controller doesn't throw on req.user.id
      req.user = { id: CURRENT_USER_ID };
      await getSupabaseDiscover(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);
app.use(errorHandler);

describe("GET /api/match/supabase-discover — page validation", () => {
  it("returns 400 when page=99999 (exceeds 1000 cap)", async () => {
    const res = await request(app)
      .get("/api/match/supabase-discover")
      .query({ page: "99999" });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/page must be an integer between 1 and 1000/i);
  });

  it("returns 400 when page=0 (below minimum)", async () => {
    const res = await request(app)
      .get("/api/match/supabase-discover")
      .query({ page: "0" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when page=-1 (negative)", async () => {
    const res = await request(app)
      .get("/api/match/supabase-discover")
      .query({ page: "-1" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when page=1.5 (non-integer)", async () => {
    const res = await request(app)
      .get("/api/match/supabase-discover")
      .query({ page: "1.5" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when page=abc (non-numeric string)", async () => {
    const res = await request(app)
      .get("/api/match/supabase-discover")
      .query({ page: "abc" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when limit=101 (exceeds 100 cap)", async () => {
    const res = await request(app)
      .get("/api/match/supabase-discover")
      .query({ limit: "101" });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/limit must be an integer between 1 and 100/i);
  });

  it("passes validation when page=1000 (boundary)", async () => {
    mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
        data: { skills: [], learning_goals: [], interests: [], learn_subjects: [], teach_subjects: [], learning_style: null, preferred_language: null, timezone: null },
        error: null,
        }),
        limit: vi.fn().mockResolvedValue({ data: PEER_PROFILES, error: null }),
    }));

    const res = await request(app).get("/api/match/supabase-discover").query({ page: "1000" });
    expect(res.status).toBe(200);
    });

    it("passes validation when page is absent (defaults to page 1)", async () => {
    mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
        data: { skills: [], learning_goals: [], interests: [], learn_subjects: [], teach_subjects: [], learning_style: null, preferred_language: null, timezone: null },
        error: null,
        }),
        limit: vi.fn().mockResolvedValue({ data: PEER_PROFILES, error: null }),
    }));

    const res = await request(app).get("/api/match/supabase-discover");
    expect(res.status).toBe(200);
    });
});

// ── Controller unit tests: correct skip calculation ───────────────────────────────
describe("getSupabaseDiscover — pagination offset calculation", () => {
  it("calculates correct skip for page=2, limit=10 → skip=10 and applies slice", async () => {
    let capturedLimit;

    // Generate 20 peers so we can test slicing
    const peers = Array.from({ length: 20 }, (_, i) => ({
      id: `uuid-peer-${i}`,
      name: `Peer ${i}`,
      skills: ["Python"],
      learning_goals: ["Python"],
    }));

    mockSupabase.from.mockImplementation((table) => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { skills: ["Python"], learning_goals: ["Python"], interests: [], learn_subjects: [], teach_subjects: [], learning_style: null, preferred_language: null, timezone: null },
          error: null,
        }),
        limit: vi.fn().mockImplementation((lim) => {
          if (table === "profiles") capturedLimit = lim;
          return {
            then: (resolve) => resolve({ data: peers, error: null }),
            or: vi.fn().mockReturnThis(),
          };
        }),
      };
      return chain;
    });

    const req = {
      user: { id: CURRENT_USER_ID },
      query: { page: "2", limit: "10" },
    };
    const res = createRes();

    await getSupabaseDiscover(req, res);

    expect(capturedLimit).toBe(1000);

    // Page 2, Limit 10 means we should get elements 10 through 19 (length 10)
    expect(res.json).toHaveBeenCalled();
    const responsePayload = res.json.mock.calls[0][0];
    expect(responsePayload.recommendations).toHaveLength(10);
  });

  it("clamps page=99999 to 1000 at the controller level (defence-in-depth)", async () => {
    let capturedLimit;

    mockSupabase.from.mockImplementation((table) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { skills: [], learning_goals: [], interests: [], learn_subjects: [], teach_subjects: [], learning_style: null, preferred_language: null, timezone: null },
        error: null,
      }),
      limit: vi.fn().mockImplementation((lim) => {
        if (table === "profiles") capturedLimit = lim;
        return { then: (resolve) => resolve({ data: [], error: null }), or: vi.fn().mockReturnThis() };
      }),
    }));

    const req = {
      user: { id: CURRENT_USER_ID },
      query: { page: "99999", limit: "100" },
    };
    const res = createRes();

    await getSupabaseDiscover(req, res);

    // Limit is hardcoded to 1000
    expect(capturedLimit).toBe(1000);
  });
});

// ── Regression guard for #1227 ─────────────────────────────────────────────────────
// skills is a text[] column; ilike is a scalar operator and cannot match inside
// array elements. These tests assert the array-aware operators are used instead.
describe("getSupabaseDiscover — skill array search (regression for #1227)", () => {
  it("search uses array-overlap operator 'ov' on skills, not ilike", async () => {
    let capturedOrArg;
    const peers = [
      { id: "uuid-alice", name: "Alice", skills: ["Python"], interests: [], learning_goals: [], teach_subjects: [], learn_subjects: [] },
    ];

    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { skills: [], learning_goals: [], interests: [], learn_subjects: [], teach_subjects: [], learning_style: null, preferred_language: null, timezone: null },
        error: null,
      }),
      limit: vi.fn().mockImplementation(() => ({
        or: vi.fn().mockImplementation((arg) => {
          capturedOrArg = arg;
          return { then: (resolve) => resolve({ data: peers, error: null }) };
        }),
        then: (resolve) => resolve({ data: peers, error: null }),
      })),
    }));

    const req = { user: { id: CURRENT_USER_ID }, query: { search: "Python" } };
    const res = createRes();

    await getSupabaseDiscover(req, res);

    expect(capturedOrArg).toContain("skills.ov.");
    expect(capturedOrArg).not.toContain("skills.ilike");

    const body = res.json.mock.calls[0][0];
    expect(body.recommendations.map((p) => p.id)).toContain("uuid-alice");
  });

  it("filter chip uses .contains() on skills, not ilike", async () => {
    let containsArgs;
    const peers = [
      { id: "uuid-alice", name: "Alice", skills: ["Python"], interests: [], learning_goals: [], teach_subjects: [], learn_subjects: [] },
    ];

    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { skills: [], learning_goals: [], interests: [], learn_subjects: [], teach_subjects: [], learning_style: null, preferred_language: null, timezone: null },
        error: null,
      }),
      limit: vi.fn().mockImplementation(() => ({
        contains: vi.fn().mockImplementation((col, val) => {
          containsArgs = [col, val];
          return { then: (resolve) => resolve({ data: peers, error: null }) };
        }),
        then: (resolve) => resolve({ data: peers, error: null }),
      })),
    }));

    const req = { user: { id: CURRENT_USER_ID }, query: { filter: "Python" } };
    const res = createRes();

    await getSupabaseDiscover(req, res);

    expect(containsArgs).toEqual(["skills", ["Python"]]);

    const body = res.json.mock.calls[0][0];
    expect(body.recommendations.map((p) => p.id)).toContain("uuid-alice");
  });
});