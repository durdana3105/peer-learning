/**
 * pushDeliveryCleanup.js
 *
 * Shared helper for identifying push subscriptions that should be deleted
 * after a delivery attempt. A subscription is considered expired when the
 * web-push library rejects the send with HTTP 410 (Gone) or 404 (Not Found),
 * which indicates the browser has unsubscribed or revoked permission.
 */

/**
 * collectExpiredSubscriptionIds
 *
 * Given a list of subscriptions and the corresponding Promise.allSettled
 * results from webpush.sendNotification calls (one result per subscription,
 * in the same order), returns an array of subscription IDs whose delivery
 * was rejected with a 410 or 404 status code.
 *
 * @param {Array<{ id: string, endpoint: string }>} subscriptions
 * @param {Array<PromiseSettledResult>} pushResults  - output of Promise.allSettled(...)
 * @returns {string[]} IDs of expired/invalid subscriptions to delete
 */
export function collectExpiredSubscriptionIds(subscriptions, pushResults) {
  const expiredIds = [];
  for (let i = 0; i < subscriptions.length; i++) {
    const result = pushResults[i];
    if (
      result?.status === "rejected" &&
      (result.reason?.statusCode === 410 || result.reason?.statusCode === 404)
    ) {
      expiredIds.push(subscriptions[i].id);
    }
  }
  return expiredIds;
}
