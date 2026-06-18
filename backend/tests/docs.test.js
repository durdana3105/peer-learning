import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Documentation completeness smoke-tests.
 *
 * These tests assert that production-facing API endpoints are mentioned in
 * docs/api.md. They are intentionally coarse — they check for the route path
 * string, not for a full schema — so they are fast and not brittle to prose
 * changes. Add a new assertion here whenever a new route is added to
 * cronRoutes.js or notificationRoutes.js.
 */

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const repoRoot = resolve(__dirname, "../../");
const apiDoc = readFileSync(resolve(repoRoot, "docs/api.md"), "utf-8");
const notifDoc = readFileSync(resolve(repoRoot, "docs/smart-notifications.md"), "utf-8");

describe("API documentation completeness", () => {
  const requiredRoutes = [
    "/api/cron/dispatch-notifications",
    "/api/cron/reminders",
    "/api/cron/mentorship-reminders",
    "/api/notifications/send-push",
  ];

  for (const route of requiredRoutes) {
    it(`docs/api.md documents the route ${route}`, () => {
      expect(apiDoc).toContain(route);
    });
  }

  it("docs/api.md documents the CRON_SECRET auth requirement", () => {
    expect(apiDoc).toContain("CRON_SECRET");
  });

  it("docs/api.md documents the WEBHOOK_SECRET auth requirement", () => {
    expect(apiDoc).toContain("WEBHOOK_SECRET");
  });
});

describe("Operational runbook completeness", () => {
  it("smart-notifications.md contains a queue-depth monitoring query", () => {
    expect(notifDoc).toContain("push_sent_at IS NULL");
  });

  it("smart-notifications.md documents the 100-row batch cap", () => {
    expect(notifDoc).toContain("100");
  });

  it("smart-notifications.md documents the manual drain procedure", () => {
    expect(notifDoc.toLowerCase()).toContain("manual drain");
  });

  it("smart-notifications.md documents the CRON_SECRET / WEBHOOK_SECRET split", () => {
    expect(notifDoc).toContain("CRON_SECRET");
    expect(notifDoc).toContain("WEBHOOK_SECRET");
  });

  it("smart-notifications.md documents the 60-second cooldown", () => {
    expect(notifDoc).toContain("60-second");
  });

  it("smart-notifications.md covers the 410/404 subscription expiry contract", () => {
    expect(notifDoc).toContain("410");
    expect(notifDoc).toContain("404");
  });
});

describe("TROUBLESHOOTING.md completeness", () => {
  const troubleshoot = readFileSync(resolve(repoRoot, "TROUBLESHOOTING.md"), "utf-8");

  it("TROUBLESHOOTING.md has a push notification section", () => {
    expect(troubleshoot.toLowerCase()).toContain("push notification");
  });

  it("TROUBLESHOOTING.md mentions VAPID configuration", () => {
    expect(troubleshoot).toContain("VAPID");
  });
});
