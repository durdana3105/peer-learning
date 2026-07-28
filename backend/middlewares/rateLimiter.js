/**
 * Lightweight, in-memory rate limiter.
 *
 * DESIGN DECISION:
 * This rate limiter stores request tracking data in a local Node.js Map.
 * - PRO: Extremely fast (zero latency), zero infrastructure dependency.
 * - CON: State resets on server restart, and is per-instance (not shared horizontally).
 *
 * For this project's current scale, this trade-off is accepted.
 * If distributed rate-limiting is required in the future (e.g., across multiple servers),
 * this can be extended to use Redis or a Supabase UNLOGGED table.
 */

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20;
const MAX_ENTRIES = 10000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

/**
 * Derives a rate-limit key for the current request.
 *
 * Priority:
 *   1. Authenticated user ID (cannot be spoofed).
 *   2. Client IP: req.ip plus the raw socket remote address, so a spoofed
 *      X-Forwarded-For still resolves to the real socket origin.
 *
 * Client-controlled headers such as User-Agent are excluded, since an attacker
 * could rotate them to obtain fresh buckets and bypass the limit.
 */
const deriveRateLimitKey = (req) => {
  if (req.user?.id) {
    return `uid:${req.user.id}`;
  }

  const expressIp = req.ip || "unknown";
  const socketIp = req.socket?.remoteAddress || "unknown";

  return `ip:${expressIp}|${socketIp}`;
};

export const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || WINDOW_MS;
  const maxRequests = options.maxRequests || MAX_REQUESTS;
  const maxEntries = options.maxEntries || MAX_ENTRIES;
  const store = new Map();
  let cleanupTime = Date.now();

  return (req, res, next) => {
    const key = deriveRateLimitKey(req);
    const now = Date.now();

    // Periodic cleanup of stale entries
    if (now - cleanupTime >= CLEANUP_INTERVAL_MS) {
      for (const [k, entry] of store.entries()) {
        if (now - entry.windowStart >= windowMs) {
          store.delete(k);
        }
      }
      cleanupTime = now;
    }

    let entry = store.get(key);

    // If new user or window expired, create a new tracking entry
    if (!entry || now - entry.windowStart >= windowMs) {
      // Prevent memory leaks by capping the Map size
      if (!entry && store.size >= maxEntries) {
        const oldestKey = store.keys().next().value;
        if (oldestKey !== undefined) {
          store.delete(oldestKey);
        }
      }
      entry = { count: 1, windowStart: now };
      store.set(key, entry);
    } else {
      entry.count += 1;
    }

    // Set standard RateLimit headers for better API UX
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetTime = new Date(entry.windowStart + windowMs);

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(resetTime.getTime() / 1000));

    if (entry.count > maxRequests) {
      return res.status(429).json({
        error: "Too many requests. Please wait before sending more messages.",
      });
    }

    next();
  };
};

export const rateLimiter = createRateLimiter();
export const protectedApiRateLimiter = rateLimiter;
