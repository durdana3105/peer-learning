export const DEFAULT_NOTIFICATION_PREFERENCES = {
  messages: { email: false, inApp: true },
  sessions: { email: false, inApp: true },
  friends: { email: false, inApp: true },
};

/**
 * Map a notifications.type enum value to a Settings preference category.
 * Unmapped types (e.g. system) return null and are treated as allowed.
 */
export function notificationTypeToCategory(type) {
  switch (type) {
    case "message":
      return "messages";
    case "session_reminder":
    case "mentorship_reminder":
    case "mentorship_reminder_overdue":
    case "announcement":
      return "sessions";
    case "friend_request":
    case "connection_request":
      return "friends";
    default:
      return null;
  }
}

/**
 * Push delivery follows the inApp channel for the given category.
 * Missing prefs / unknown categories default to allowing delivery.
 */
export function isPushAllowedForCategory(preferences, category) {
  if (!category) return true;

  const prefs = preferences && typeof preferences === "object"
    ? preferences
    : DEFAULT_NOTIFICATION_PREFERENCES;

  const channel = prefs[category];
  if (!channel || typeof channel !== "object") return true;

  return channel.inApp !== false;
}

export function resolvePushCategory({ type, category } = {}) {
  if (typeof category === "string" && category.length > 0) {
    return category;
  }
  if (typeof type === "string" && type.length > 0) {
    return notificationTypeToCategory(type);
  }
  return null;
}
