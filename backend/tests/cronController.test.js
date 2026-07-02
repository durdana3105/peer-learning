import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendSessionReminders } from "../controllers/cronController.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const createNext = () => vi.fn();

// ---------------------------------------------------------------------------
// Supabase client factory mock
// ---------------------------------------------------------------------------

// We mock `@supabase/supabase-js` so no real network calls are made.
// Each test configures the mock chain to return the data it needs.
vi.mock("@supabase/supabase-js", () => {
  const makeMockClient = vi.fn();
  return { createClient: makeMockClient };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sendSessionReminders", () => {
  let createClient;
  let mockSupabase;

  beforeEach(async () => {
    vi.restoreAllMocks();

    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key-test";

    // Re-import after restoring mocks so we always get a fresh reference.
    ({ createClient } = await import("@supabase/supabase-js"));

    // Build a chainable query builder stub.
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      upsert: vi.fn(),
    };

    mockSupabase = {
      from: vi.fn().mockReturnValue(queryBuilder),
      _queryBuilder: queryBuilder,
    };

    createClient.mockReturnValue(mockSupabase);
  });

  // ── 1. Happy path: sessions with status='scheduled' receive reminders ─────

  it("inserts notifications for sessions with status='scheduled' in the 15-min window", async () => {
    const sessionId = "sess-001";
    const mentorId = "user-mentor";
    const participantId = "user-participant";

    // First `from` call → sessions query returns one matching session.
    const sessionQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({
        data: [
          {
            id: sessionId,
            title: "Intro to Graphs",
            start_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            mentor_id: mentorId,
            session_participants: [{ user_id: participantId }],
          },
        ],
        error: null,
      }),
    };

    // Second `from` call → upsert notifications.
    const notifQueryBuilder = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };

    mockSupabase.from
      .mockReturnValueOnce(sessionQueryBuilder)
      .mockReturnValueOnce(notifQueryBuilder);

    const req = {};
    const res = createRes();
    const next = createNext();

    await sendSessionReminders(req, res, next);

    // Handler must have filtered by 'scheduled', not 'upcoming'.
    expect(sessionQueryBuilder.eq).toHaveBeenCalledWith("status", "scheduled");

    // Two notifications: one for mentor, one for participant.
    expect(notifQueryBuilder.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ user_id: mentorId, entity_id: sessionId, type: "session_reminder" }),
        expect.objectContaining({ user_id: participantId, entity_id: sessionId, type: "session_reminder" }),
      ]),
      expect.objectContaining({ onConflict: "user_id,entity_id,type", ignoreDuplicates: true })
    );

    expect(res.json).toHaveBeenCalledWith({ inserted: 2 });
    expect(next).not.toHaveBeenCalled();
  });

  // ── 2. Regression guard: query must NOT use the stale 'upcoming' literal ──

  it("never filters sessions by the stale status value 'upcoming'", async () => {
    const sessionQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockSupabase.from.mockReturnValue(sessionQueryBuilder);

    await sendSessionReminders({}, createRes(), createNext());

    const eqCalls = sessionQueryBuilder.eq.mock.calls;
    const statusCall = eqCalls.find(([col]) => col === "status");

    expect(statusCall).toBeDefined();
    expect(statusCall[1]).not.toBe("upcoming");
    expect(statusCall[1]).toBe("scheduled");
  });

  // ── 3. No sessions in window → returns { inserted: 0 } without upserting ─

  it("returns { inserted: 0 } and skips upsert when no sessions are in the window", async () => {
    const sessionQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: [], error: null }),
    };
    const notifQueryBuilder = { upsert: vi.fn() };

    mockSupabase.from
      .mockReturnValueOnce(sessionQueryBuilder)
      .mockReturnValueOnce(notifQueryBuilder);

    const res = createRes();
    await sendSessionReminders({}, res, createNext());

    expect(res.json).toHaveBeenCalledWith({ inserted: 0 });
    expect(notifQueryBuilder.upsert).not.toHaveBeenCalled();
  });

  // ── 4. Supabase session query error → 500 response, no upsert attempted ──

  it("returns 500 and forwards to next() when the sessions query errors", async () => {
    const sessionQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: null, error: { message: "db connection lost" } }),
    };

    mockSupabase.from.mockReturnValue(sessionQueryBuilder);

    const res = createRes();
    const next = createNext();
    await sendSessionReminders({}, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "db connection lost" });
  });

  // ── 5. Session with no participants still notifies the mentor only ─────────

  it("notifies only the mentor when there are no session_participants", async () => {
    const mentorId = "mentor-only";
    const sessionQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({
        data: [
          {
            id: "sess-002",
            title: "Office Hours",
            start_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            mentor_id: mentorId,
            session_participants: [],
          },
        ],
        error: null,
      }),
    };
    const notifQueryBuilder = { upsert: vi.fn().mockResolvedValue({ error: null }) };

    mockSupabase.from
      .mockReturnValueOnce(sessionQueryBuilder)
      .mockReturnValueOnce(notifQueryBuilder);

    const res = createRes();
    await sendSessionReminders({}, res, createNext());

    const [upsertPayload] = notifQueryBuilder.upsert.mock.calls[0];
    expect(upsertPayload).toHaveLength(1);
    expect(upsertPayload[0].user_id).toBe(mentorId);
    expect(res.json).toHaveBeenCalledWith({ inserted: 1 });
  });
});