import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Shared mutable state shared across both concurrent calls ────────────────
let claimedIds = new Set();
let dbRows = [];

const makeSupabaseMock = () => {
  // Returns a chainable builder that mimics the Supabase JS client.
  const builder = (table) => {
    let _filters = {};
    let _isFilters = {};
    let _operation = null;
    let _payload = null;
    let _selectCols = null;

    const chain = {
      update(payload) {
        _operation = "update";
        _payload = payload;
        return chain;
      },
      select(cols) {
        _selectCols = cols;
        return chain;
      },
      is(col, val) {
        _isFilters[col] = val;
        return chain;
      },
      eq(col, val) {
        _filters[col] = val;
        return chain;
      },
      in(col, vals) {
        _filters[`${col}__in`] = vals;
        return chain;
      },
      order() {
        return chain;
      },
      limit() {
        return chain;
      },
      // Resolve the chain
      then(resolve) {
        if (table === "notifications" && _operation === "update" && _isFilters["push_claimed_at"] === null) {
          // Atomic claim: only return rows not yet claimed
          const unclaimed = dbRows.filter(
            (r) => r.push_sent_at == null && !claimedIds.has(r.id)
          );
          const batch = unclaimed.slice(0, 100);
          batch.forEach((r) => claimedIds.add(r.id));
          return resolve({ data: batch.map(r => ({ ...r })), error: null });
        }

        if (table === "notifications" && _operation === "update" && _filters["id"]) {
          // push_sent_at stamp
          const row = dbRows.find((r) => r.id === _filters["id"]);
          if (row) row.push_sent_at = _payload.push_sent_at;
          return resolve({ data: null, error: null });
        }

        if (table === "push_subscriptions") {
          const userIds = _filters["user_id__in"] || [];
          const subs = userIds.map((uid) => ({
            user_id: uid,
            endpoint: `https://fcm.example.com/${uid}`,
            p256dh: "p256dh_key",
            auth: "auth_key",
          }));
          return resolve({ data: subs, error: null });
        }

        return resolve({ data: [], error: null });
      },
    };
    return chain;
  };

  return { from: (table) => builder(table) };
};

// ─── Module mocks ────────────────────────────────────────────────────────────
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => makeSupabaseMock(),
}));

// Slow sendNotification (~150 ms) to widen the race window
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve({ statusCode: 201 }), 150))
    ),
  },
}));

// ─── App fixture ─────────────────────────────────────────────────────────────
const buildApp = async () => {
  const { dispatchPushNotifications } = await import(
    "../controllers/cronController.js"
  );
  const app = express();
  app.use(express.json());
  app.post("/dispatch", dispatchPushNotifications);
  app.use((err, _req, res, _next) => res.status(500).json({ error: err.message }));
  return app;
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe("dispatchPushNotifications — race condition", () => {
  let app;

  beforeEach(async () => {
    vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("VAPID_PUBLIC_KEY", "vapid-public");
    vi.stubEnv("VAPID_PRIVATE_KEY", "vapid-private");

    // Reset shared DB state
    claimedIds = new Set();
    dbRows = Array.from({ length: 5 }, (_, i) => ({
      id: `notif-${i}`,
      user_id: `user-${i}`,
      title: `Title ${i}`,
      body: `Body ${i}`,
      action_url: "/notifications",
      push_sent_at: null,
      push_claimed_at: null,
    }));

    app = await buildApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("concurrent calls do not double-deliver: total sent === seeded count", async () => {
    const [res1, res2] = await Promise.all([
      request(app).post("/dispatch"),
      request(app).post("/dispatch"),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const totalSent = res1.body.sent + res2.body.sent;
    const totalProcessed = res1.body.processed + res2.body.processed;

    // Each of the 5 notifications should be dispatched exactly once
    expect(totalProcessed).toBe(5);
    // 5 notifications × 1 subscription each = 5 successful pushes
    expect(totalSent).toBe(5);
  });

  it("all rows have push_sent_at set after concurrent invocations", async () => {
    await Promise.all([
      request(app).post("/dispatch"),
      request(app).post("/dispatch"),
    ]);

    const unsent = dbRows.filter((r) => r.push_sent_at == null);
    expect(unsent).toHaveLength(0);
  });

  it("single call: returns sent=N, processed=N for N seeded rows", async () => {
    const res = await request(app).post("/dispatch");
    expect(res.status).toBe(200);
    expect(res.body.processed).toBe(5);
    expect(res.body.sent).toBe(5);
  });

  it("returns sent=0, processed=0 when no pending notifications exist", async () => {
    dbRows = []; // nothing to dispatch
    const res = await request(app).post("/dispatch");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sent: 0, processed: 0 });
  });

  it("claimed notifications remain retryable after subscription fetch error", async () => {
  // Inject a subscription-fetch failure on the first call
  const supabaseMock = makeSupabaseMock();
  const originalFrom = supabaseMock.from.bind(supabaseMock);

  vi.spyOn(supabaseMock, "from").mockImplementationOnce((table) => {
    if (table === "push_subscriptions") {
      return {
        select: () => ({
          in: () => Promise.resolve({ data: null, error: { message: "DB error" } }),
        }),
      };
    }
    return originalFrom(table);
  });

  // First call: subscription fetch fails → should 500
  const res1 = await request(app).post("/dispatch");
  expect(res1.status).toBe(500);

  // Rows should still be pending (push_sent_at not set)
  const stillPending = dbRows.filter((r) => r.push_sent_at == null);
  expect(stillPending.length).toBeGreaterThan(0);

  // Second call: mock restored, stale claim timeout allows re-claim → should succeed
  const res2 = await request(app).post("/dispatch");
  expect(res2.status).toBe(200);
  expect(res2.body.processed).toBeGreaterThan(0);
  expect(res2.body.sent).toBeGreaterThan(0);
});
});