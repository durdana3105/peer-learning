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

export const createRateLimiter = rateLimiter;
export const protectedApiRateLimiter = rateLimiter;
export const rateLimiter = (req, res, next) => {
  // If the user is unauthenticated, fallback to req.ip.
  // Because 'trust proxy' in app.js is conditionally secured, req.ip cannot be spoofed 
  // via X-Forwarded-For headers unless explicitly allowed by infrastructure.
  const userId = req.user?.id || req.ip;
  const now = Date.now();

  // Passive eviction: clean up stale entries lazily to avoid holding the event loop open
  if (now - lastCleanup >= CLEANUP_INTERVAL_MS) {
    evictStaleEntries(now);
    lastCleanup = now;
  }

  let entry = requestCounts.get(userId);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    if (!entry && requestCounts.size >= MAX_ENTRIES) {
      const oldestKey = requestCounts.keys().next().value;
      if (oldestKey !== undefined) {
        requestCounts.delete(oldestKey);
      }
    }
    requestCounts.set(userId, { count: 1, windowStart: now });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: "Too many requests. Please wait before sending more messages.",
    });
  }

  entry.count += 1;
  next();
};

