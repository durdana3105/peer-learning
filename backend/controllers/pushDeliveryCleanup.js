// backend/utils/pushDeliveryCleanup.js
//
// Shared between cronController.js (dispatchPushNotifications) and
// notificationController.js (sendPushNotification) so subscription cleanup
// logic lives in exactly one place (fixes #1676 — cleanup previously only
// existed in the single-notification path, not the cron/bulk path).

// Given the subscriptions that were attempted and the Promise.allSettled
// results in the same order, return the set of subscription ids that are
// permanently dead (410 Gone / 404 Not Found) and should be deleted.
export const collectExpiredSubscriptionIds = (subscriptions, pushResults) => {
  const ids = new Set();
  pushResults.forEach((result, index) => {
    if (
      result.status === "rejected" &&
      (result.reason?.statusCode === 404 || result.reason?.statusCode === 410)
    ) {
      ids.add(subscriptions[index].id);
    }
  });
  return ids;
};