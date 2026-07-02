import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createBackgroundRateLimiter,
  createCooldownTracker,
} from "../middlewares/requireCronSecret.js";

describe("createBackgroundRateLimiter", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("allows the first request from an IP", () => {
    const limiter = createBackgroundRateLimiter(60_000, 5);
    expect(limiter("1.2.3.4")).toBe(false);
  });

  it("allows up to maxRequests within the window", () => {
    const limiter = createBackgroundRateLimiter(60_000, 5);
    for (let i = 0; i < 5; i++) {
      expect(limiter("1.2.3.4")).toBe(false);
    }
  });

  it("blocks the (maxRequests + 1)th request within the window", () => {
    const limiter = createBackgroundRateLimiter(60_000, 5);
    for (let i = 0; i < 5; i++) limiter("1.2.3.4");
    expect(limiter("1.2.3.4")).toBe(true);
  });

  it("resets the counter after the window expires", () => {
    const limiter = createBackgroundRateLimiter(60_000, 5);
    for (let i = 0; i < 5; i++) limiter("1.2.3.4");
    expect(limiter("1.2.3.4")).toBe(true);

    vi.advanceTimersByTime(60_001);
    expect(limiter("1.2.3.4")).toBe(false); // window reset
  });

  it("tracks different IPs independently", () => {
    const limiter = createBackgroundRateLimiter(60_000, 5);
    for (let i = 0; i < 5; i++) limiter("1.1.1.1");
    expect(limiter("1.1.1.1")).toBe(true);  // exhausted
    expect(limiter("2.2.2.2")).toBe(false); // fresh IP unaffected
  });

  // ── Isolation: the key property this fix restores ────────────────────────────
  it("two independent limiter instances do NOT share state", () => {
    const cronLimiter = createBackgroundRateLimiter(60_000, 5);
    const notifLimiter = createBackgroundRateLimiter(60_000, 5);

    // Exhaust cron limiter from shared IP
    for (let i = 0; i < 5; i++) cronLimiter("10.0.0.1");
    expect(cronLimiter("10.0.0.1")).toBe(true); // cron blocked

    // Notification limiter from same IP must be unaffected
    expect(notifLimiter("10.0.0.1")).toBe(false); // still allowed
  });
});

describe("createCooldownTracker", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("allows first invocation of a route key", () => {
    const cooldown = createCooldownTracker(60_000);
    expect(cooldown("POST:/api/cron/dispatch-notifications")).toBe(false);
  });

  it("blocks re-invocation within the cooldown window", () => {
    const cooldown = createCooldownTracker(60_000);
    cooldown("POST:/api/cron/dispatch-notifications");
    expect(cooldown("POST:/api/cron/dispatch-notifications")).toBe(true);
  });

  it("allows re-invocation after the cooldown expires", () => {
    const cooldown = createCooldownTracker(60_000);
    cooldown("POST:/api/cron/dispatch-notifications");
    vi.advanceTimersByTime(60_001);
    expect(cooldown("POST:/api/cron/dispatch-notifications")).toBe(false);
  });

  it("tracks different route keys independently", () => {
    const cooldown = createCooldownTracker(60_000);
    cooldown("POST:/api/cron/dispatch-notifications");
    expect(cooldown("POST:/api/cron/dispatch-notifications")).toBe(true);
    expect(cooldown("POST:/api/notifications/send-push")).toBe(false);
  });

  // ── Isolation ────────────────────────────────────────────────────────────────
  it("two independent cooldown instances do NOT share state", () => {
    const cronCooldown = createCooldownTracker(60_000);
    const notifCooldown = createCooldownTracker(60_000);
    const KEY = "POST:/shared-route";

    cronCooldown(KEY);
    expect(cronCooldown(KEY)).toBe(true);   // cron on cooldown
    expect(notifCooldown(KEY)).toBe(false); // notif cooldown unaffected
  });
});