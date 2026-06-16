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
    // Set up Supabase to return a valid profile so the controller completes
    mockSingle.mockResolvedValueOnce({ data: { skills: [], learning_goals: [], interests: [], learn_subjects: [], teach_subjects: [], learning_style: null, preferred_language: null, timezone: null }, error: null });
    mockQueryResult.mockReturnValueOnce({ data: PEER_PROFILES, error: null });

    const res = await request(app)
      .get("/api/match/supabase-discover")
      .query({ page: "1000" });

    // 200 or 404 (if mock chain mismatch) — either way NOT 400
    expect(res.status).not.toBe(400);
  });

  it("passes validation when page is absent (defaults to page 1)", async () => {
    mockSingle.mockResolvedValueOnce({ data: { skills: [], learning_goals: [], interests: [], learn_subjects: [], teach_subjects: [], learning_style: null, preferred_language: null, timezone: null }, error: null });
    mockQueryResult.mockReturnValueOnce({ data: PEER_PROFILES, error: null });

    const res = await request(app)
      .get("/api/match/supabase-discover");

    expect(res.status).not.toBe(400);
  });
});

// ── Controller unit tests: correct skip calculation ───────────────────────────────
describe("getSupabaseDiscover — pagination offset calculation", () => {
  it("calculates correct skip for page=2, limit=10 → skip=10", async () => {
    let capturedRange;

    mockSupabase.from.mockImplementation((table) => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { skills: [], learning_goals: [], interests: [], learn_subjects: [], teach_subjects: [], learning_style: null, preferred_language: null, timezone: null },
          error: null,
        }),
        range: vi.fn().mockImplementation((from, to) => {
          if (table === "profiles") capturedRange = { from, to };
          return {
            then: (resolve) => resolve({ data: [], error: null }),
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

    expect(capturedRange).toEqual({ from: 10, to: 19 }); // skip=10, skip+limit-1=19
  });

  it("clamps page=99999 to 1000 at the controller level (defence-in-depth)", async () => {
    let capturedRange;

    mockSupabase.from.mockImplementation((table) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { skills: [], learning_goals: [], interests: [], learn_subjects: [], teach_subjects: [], learning_style: null, preferred_language: null, timezone: null },
        error: null,
      }),
      range: vi.fn().mockImplementation((from, to) => {
        if (table === "profiles") capturedRange = { from, to };
        return { then: (resolve) => resolve({ data: [], error: null }), or: vi.fn().mockReturnThis() };
      }),
    }));

    const req = {
      user: { id: CURRENT_USER_ID },
      query: { page: "99999", limit: "100" },
    };
    const res = createRes();

    await getSupabaseDiscover(req, res);

    // With clamp at 1000: skip = (1000-1)*100 = 99900
    expect(capturedRange.from).toBe(99900);
    expect(capturedRange.from).toBeLessThan(100000); // never reaches row 9,999,800
  });
});