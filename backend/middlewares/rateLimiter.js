const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20;
const MAX_ENTRIES = 10000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

const requestCounts = new Map();
let lastCleanup = Date.now();

const evictStaleEntries = (now) => {
  for (const [key, entry] of requestCounts.entries()) {
    if (now - entry.windowStart >= WINDOW_MS) {
      requestCounts.delete(key);
    }
  }
};

export const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || WINDOW_MS;
  const maxRequests = options.maxRequests || MAX_REQUESTS;
  const maxEntries = options.maxEntries || MAX_ENTRIES;
  const message = options.message || "Too many requests. Please wait before sending more messages.";
  const store = new Map();
  let cleanupTime = Date.now();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();

    if (now - cleanupTime >= CLEANUP_INTERVAL_MS) {
      for (const [key, entry] of store.entries()) {
        if (now - entry.windowStart >= windowMs) {
          store.delete(key);
        }
      }
      cleanupTime = now;
    }

    let entry = store.get(userId);

    if (!entry || now - entry.windowStart >= windowMs) {
      if (!entry && store.size >= maxEntries) {
        const oldestKey = store.keys().next().value;
        if (oldestKey !== undefined) {
          store.delete(oldestKey);
        }
      }
      store.set(userId, { count: 1, windowStart: now });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({
        statusCode: 429,
        message,
      });
    }

    entry.count += 1;
    next();
  };
};

export const rateLimiter = createRateLimiter();
export const protectedApiRateLimiter = rateLimiter;
