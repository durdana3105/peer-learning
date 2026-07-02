/**
 * Centralized error logger.
 * Designed to act as the single injection point for future telemetry (e.g., Sentry, Datadog).
 */
export const logError = (error: unknown, context?: Record<string, any>) => {
  // In the future, this is where we'd send errors to Sentry or another service
  if (context) {
    console.error("[ERROR LOG]:", error, "Context:", context);
  } else {
    console.error("[ERROR LOG]:", error);
  }
};
