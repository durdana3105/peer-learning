import { describe, expect, it } from "vitest";
import {
  isPushAllowedForCategory,
  notificationTypeToCategory,
  resolvePushCategory,
} from "../utils/notificationPreferences.js";

describe("notificationTypeToCategory", () => {
  it("maps message and session-related types onto settings categories", () => {
    expect(notificationTypeToCategory("message")).toBe("messages");
    expect(notificationTypeToCategory("session_reminder")).toBe("sessions");
    expect(notificationTypeToCategory("mentorship_reminder")).toBe("sessions");
    expect(notificationTypeToCategory("announcement")).toBe("sessions");
    expect(notificationTypeToCategory("friend_request")).toBe("friends");
  });

  it("returns null for unmapped types", () => {
    expect(notificationTypeToCategory("system")).toBeNull();
    expect(notificationTypeToCategory(undefined)).toBeNull();
  });
});

describe("isPushAllowedForCategory", () => {
  it("allows delivery when preferences are missing or the category is unknown", () => {
    expect(isPushAllowedForCategory(null, "messages")).toBe(true);
    expect(isPushAllowedForCategory({}, null)).toBe(true);
  });

  it("suppresses push when the category inApp channel is disabled", () => {
    const prefs = {
      messages: { inApp: false },
      sessions: { inApp: true },
      friends: { inApp: true },
    };

    expect(isPushAllowedForCategory(prefs, "messages")).toBe(false);
    expect(isPushAllowedForCategory(prefs, "sessions")).toBe(true);
  });
});

describe("resolvePushCategory", () => {
  it("prefers an explicit category over type mapping", () => {
    expect(resolvePushCategory({ type: "message", category: "friends" })).toBe("friends");
    expect(resolvePushCategory({ type: "session_reminder" })).toBe("sessions");
  });
});
