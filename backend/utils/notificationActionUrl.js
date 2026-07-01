export const DEFAULT_NOTIFICATION_ACTION_URL = "/notifications";

export function sanitizeNotificationActionUrl(value) {
  if (typeof value !== "string") return DEFAULT_NOTIFICATION_ACTION_URL;

  const trimmed = value.trim();

  if (!trimmed) return DEFAULT_NOTIFICATION_ACTION_URL;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_NOTIFICATION_ACTION_URL;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("/javascript:") ||
    lower.startsWith("/data:") ||
    lower.includes("\\")
  ) {
    return DEFAULT_NOTIFICATION_ACTION_URL;
  }

  return trimmed;
}
