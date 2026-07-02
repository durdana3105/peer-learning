import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFICATION_ACTION_URL,
  sanitizeNotificationActionUrl,
} from "../utils/notificationActionUrl.js";

describe("sanitizeNotificationActionUrl", () => {
  it("allows relative app paths", () => {
    expect(sanitizeNotificationActionUrl("/notifications")).toBe("/notifications");
    expect(sanitizeNotificationActionUrl("/sessions")).toBe("/sessions");
    expect(sanitizeNotificationActionUrl("/dashboard")).toBe("/dashboard");
    expect(sanitizeNotificationActionUrl("/some/path?query=value")).toBe(
      "/some/path?query=value"
    );
  });

  it("falls back for unsafe values", () => {
    const unsafeValues = [
      "https://example.com",
      "http://example.com",
      "//example.com",
      "javascript:alert(1)",
      "data:text/html,<h1>x</h1>",
      "/javascript:alert(1)",
      "/data:text/html,<h1>x</h1>",
      "/foo\\bar",
      "",
      null,
      undefined,
      42,
    ];

    for (const value of unsafeValues) {
      expect(sanitizeNotificationActionUrl(value)).toBe(
        DEFAULT_NOTIFICATION_ACTION_URL
      );
    }
  });

  it("trims safe values before returning them", () => {
    expect(sanitizeNotificationActionUrl("  /sessions  ")).toBe("/sessions");
  });
});
