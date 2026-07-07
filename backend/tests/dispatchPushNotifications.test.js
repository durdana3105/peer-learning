import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PUSH_CLAIM_TTL_MS = 5 * 60 * 1000;
const MAX_PUSH_ATTEMPTS = 5;

// ─── Shared mutable state across mock DB calls ───────────────────────────────
let dbRows = [];
let subscriptionStore = []; // { id, user_id, endpoint, p256dh, auth }
let endpointBehavior = {}; // endpoint -> "success" | "fail" | "expired"

const makeSupabaseMock = () => {
  const builder = (table) => {
    let _filters = {};
    let _operation = null;
    let _payload = null;
    let _isOrClaim = false;

    const chain = {
      update(payload) {
        _operation = "update";
        _payload = payload;
        return chain;
      },
      delete() {
        _operation = "delete";
        return chain;
      },
      select() {
        return chain;
      },
      is() {
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
      or() {
        _isOrClaim = true;
        return chain;
      },
      order() {
        return chain;
      },
      limit() {
        return chain;
      },
      then(resolve) {
        // Claim query: unsent, not permanently failed, and either unclaimed
        // or claimed long enough ago that the claim has expired.
        if (table === "notifications" && _operation === "update" && _isOrClaim) {
          const now = Date.now();
          const claimable = dbRows.filter((r) => {
            if (r.push_sent_at != null) return false;
            if (r.push_failed_at != null) return false;
            if (r.push_claimed_at == null) return true;
            return now - new Date(r.push_claimed_at).getTime() > PUSH_CLAIM_TTL_MS;
          });
          const batch = claimable.slice(0, 100);
          batch.forEach((r) => {
            r.push_claimed_at = _payload.push_claimed_at;
          });
          return resolve({ data: batch.map((r) => ({ ...r })), error: null });
        }

        // Rollback: release claim after a subscription-fetch error.
        if (
          table === "notifications" &&
          _operation === "update" &&
          _filters["id__in"] &&
          _payload?.push_claimed_at === null
        ) {
          _filters["id__in"].forEach((id) => {
            const row = dbRows.find((r) => r.id === id);
            if (row) row.push_claimed_at = null;
          });
          return resolve({ data: null, error: null });
        }

        // Per-notification stamp: success / attempt increment / permanent failure.
        if (table === "notifications" && _operation === "update" && _filters["id"]) {
          const row = dbRows.find((r) => r.id === _filters["id"]);
          if (row) Object.assign(row, _payload);
          return resolve({ data: null, error: null });
        }

        // Expired-subscription cleanup.
        if (table === "push_subscriptions" && _operation === "delete" && _filters["id__in"]) {
          const ids = new Set(_filters["id__in"]);
          subscriptionStore = subscriptionStore.filter((s) => !ids.has(s.id));
          return resolve({ data: null, error: null });
        }

        // Fetch subscriptions for claimed notifications.
        if (table === "push_subscriptions" && !_operation) {
          const userIds = _filters["user_id__in"] || [];
          const subs = subscriptionStore.filter((s) => userIds.includes(s.user_id));
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
let forceSubscriptionError = false;
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => {
    const mock = makeSupabaseMock();
    const originalFrom = mock.from.bind(mock);
    mock.from = (table) => {
      if (table === "push_subscriptions" && forceSubscriptionError) {
        forceSubscriptionError = false; // only fail once
        const fakeChain = new Promise((resolve) => resolve({ data: null, error: { message: "DB error" } }));
        Object.assign(fakeChain, { select: () => fakeChain, in: () => fakeChain });
        return fakeChain;
      }
      return originalFrom(table);
    };
    return mock;
  },
}));

vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn((subscription) => {
      const behavior = endpointBehavior[subscription.endpoint] || "success";
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (behavior === "success") resolve({ statusCode: 201 });
          else if (behavior === "expired") reject({ statusCode: 410, message: "gone" });
          else reject({ statusCode: 500, message: "push failed" });
        }, 20);
      });
    }),
  },
}));

// ─── App fixture ─────────────────────────────────────────────────────────────
const buildApp = async () => {
  const { dispatchPushNotifications } = await import("../controllers/cronController.js");
  const app = express();
  app.use(express.json());
  app.post("/dispatch", dispatchPushNotifications);
  app.use((err, _req, res, _next) => res.status(500).json({ error: err.message }));
  return app;
};

const seedRow = (overrides = {}) => ({
  id: `notif-${Math.random()}`,
  user_id: "user-1",
  title: "Title",
  body: "Body",
  action_url: "/notifications",
  push_sent_at: null,
  push_claimed_at: null,
  push_failed_at: null,
  push_attempts: 0,
  ...overrides,
});

describe("dispatchPushNotifications", () => {
  let app;

  beforeEach(async () => {
    vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
    vi.stubEnv("VAPID_PUBLIC_KEY", "vapid-public");
    vi.stubEnv("VAPID_PRIVATE_KEY", "vapid-private");

    forceSubscriptionError = false;
    endpointBehavior = {};
    dbRows = [];
    subscriptionStore = [];
    app = await buildApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe("happy path", () => {
    it("returns sent=N, processed=N for N seeded rows", async () => {
      dbRows = [seedRow({ id: "notif-a", user_id: "user-a" })];
      subscriptionStore = [{ id: "sub-a", user_id: "user-a", endpoint: "ep-a", p256dh: "k", auth: "a" }];
      endpointBehavior["ep-a"] = "success";

      const res = await request(app).post("/dispatch");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sent: 1, processed: 1 });
      expect(dbRows[0].push_sent_at).not.toBeNull();
    });

    it("returns sent=0, processed=0 when no pending notifications exist", async () => {
      dbRows = [];
      const res = await request(app).post("/dispatch");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sent: 0, processed: 0 });
    });

    it("sanitizes queued action_url values before sending push payloads", async () => {
      dbRows = [seedRow({ id: "unsafe-notif", user_id: "user-unsafe", action_url: "https://example.com" })];
      subscriptionStore = [{ id: "sub-1", user_id: "user-unsafe", endpoint: "ep-1", p256dh: "k", auth: "a" }];
      endpointBehavior["ep-1"] = "success";

      const res = await request(app).post("/dispatch");
      expect(res.status).toBe(200);

      const webpush = (await import("web-push")).default;
      const payload = JSON.parse(webpush.sendNotification.mock.calls[0][1]);
      expect(payload.action_url).toBe("/notifications");
    });
  });

  describe("concurrency (race condition, issue #804)", () => {
    it("concurrent calls do not double-deliver: total sent === seeded count", async () => {
      dbRows = Array.from({ length: 5 }, (_, i) => seedRow({ id: `notif-${i}`, user_id: `user-${i}` }));
      subscriptionStore = dbRows.map((r) => ({
        id: `sub-${r.user_id}`,
        user_id: r.user_id,
        endpoint: `ep-${r.user_id}`,
        p256dh: "k",
        auth: "a",
      }));
      dbRows.forEach((r) => (endpointBehavior[`ep-${r.user_id}`] = "success"));

      const [res1, res2] = await Promise.all([
        request(app).post("/dispatch"),
        request(app).post("/dispatch"),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      const totalSent = res1.body.sent + res2.body.sent;
      const totalProcessed = res1.body.processed + res2.body.processed;

      expect(totalProcessed).toBe(5);
      expect(totalSent).toBe(5);
    });
  });

  describe("failed delivery retry/expiry (issue #1676)", () => {
    it("keeps a fully-failed notification claimed but does not immediately retry it", async () => {
      dbRows = [seedRow({ id: "notif-fail", user_id: "user-fail" })];
      subscriptionStore = [{ id: "sub-1", user_id: "user-fail", endpoint: "ep-fail", p256dh: "k", auth: "a" }];
      endpointBehavior["ep-fail"] = "fail";

      const res1 = await request(app).post("/dispatch");
      expect(res1.body).toEqual({ sent: 0, processed: 1 });

      const row = dbRows[0];
      expect(row.push_sent_at).toBeNull();
      expect(row.push_failed_at).toBeNull();
      expect(row.push_attempts).toBe(1);
      expect(row.push_claimed_at).not.toBeNull();

      // Immediately re-running should NOT reclaim it (claim hasn't expired yet).
      const res2 = await request(app).post("/dispatch");
      expect(res2.body).toEqual({ sent: 0, processed: 0 });
      expect(row.push_attempts).toBe(1);
    });

    it("retries a fully-failed notification once its claim has expired", async () => {
      dbRows = [
        seedRow({
          id: "notif-expired-claim",
          user_id: "user-fail",
          push_attempts: 1,
          push_claimed_at: new Date(Date.now() - PUSH_CLAIM_TTL_MS - 1000).toISOString(),
        }),
      ];
      subscriptionStore = [{ id: "sub-1", user_id: "user-fail", endpoint: "ep-fail", p256dh: "k", auth: "a" }];
      endpointBehavior["ep-fail"] = "fail";

      const res = await request(app).post("/dispatch");
      expect(res.body).toEqual({ sent: 0, processed: 1 });
      expect(dbRows[0].push_attempts).toBe(2);
      expect(dbRows[0].push_failed_at).toBeNull();
    });

    it("permanently gives up after MAX_PUSH_ATTEMPTS and stops reclaiming the row", async () => {
      dbRows = [
        seedRow({
          id: "notif-give-up",
          user_id: "user-fail",
          push_attempts: MAX_PUSH_ATTEMPTS - 1,
          push_claimed_at: new Date(Date.now() - PUSH_CLAIM_TTL_MS - 1000).toISOString(),
        }),
      ];
      subscriptionStore = [{ id: "sub-1", user_id: "user-fail", endpoint: "ep-fail", p256dh: "k", auth: "a" }];
      endpointBehavior["ep-fail"] = "fail";

      const res1 = await request(app).post("/dispatch");
      expect(res1.body).toEqual({ sent: 0, processed: 1 });
      expect(dbRows[0].push_attempts).toBe(MAX_PUSH_ATTEMPTS);
      expect(dbRows[0].push_failed_at).not.toBeNull();

      // Even after the claim would have expired, it's excluded forever now.
      dbRows[0].push_claimed_at = new Date(Date.now() - PUSH_CLAIM_TTL_MS - 1000).toISOString();
      const res2 = await request(app).post("/dispatch");
      expect(res2.body).toEqual({ sent: 0, processed: 0 });
    });

    it("marks a notification with no subscriptions as permanently failed immediately", async () => {
      dbRows = [seedRow({ id: "notif-no-subs", user_id: "user-no-subs" })];
      subscriptionStore = [];

      const res = await request(app).post("/dispatch");
      expect(res.body).toEqual({ sent: 0, processed: 1 });
      expect(dbRows[0].push_failed_at).not.toBeNull();
      expect(dbRows[0].push_attempts).toBe(0);
    });
  });

  describe("subscription cleanup", () => {
    it("deletes an expired (410) push subscription during dispatch, keeping the working one", async () => {
      dbRows = [seedRow({ id: "notif-mixed", user_id: "user-mixed" })];
      subscriptionStore = [
        { id: "sub-good", user_id: "user-mixed", endpoint: "ep-good", p256dh: "k", auth: "a" },
        { id: "sub-dead", user_id: "user-mixed", endpoint: "ep-dead", p256dh: "k", auth: "a" },
      ];
      endpointBehavior["ep-good"] = "success";
      endpointBehavior["ep-dead"] = "expired";

      const res = await request(app).post("/dispatch");
      expect(res.body).toEqual({ sent: 1, processed: 1 });
      expect(dbRows[0].push_sent_at).not.toBeNull();

      expect(subscriptionStore.map((s) => s.id)).toEqual(["sub-good"]);
    });
  });

  describe("subscription fetch failure", () => {
    it("claimed notifications remain retryable after subscription fetch error", async () => {
      dbRows = [seedRow({ id: "notif-suberr", user_id: "user-suberr" })];
      subscriptionStore = [{ id: "sub-1", user_id: "user-suberr", endpoint: "ep-1", p256dh: "k", auth: "a" }];
      endpointBehavior["ep-1"] = "success";
      forceSubscriptionError = true;

      const res1 = await request(app).post("/dispatch");
      expect(res1.status).toBe(500);
      expect(dbRows[0].push_claimed_at).toBeNull();

      const res2 = await request(app).post("/dispatch");
      expect(res2.status).toBe(200);
      expect(res2.body).toEqual({ sent: 1, processed: 1 });
    });
  });
});