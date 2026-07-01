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
 *   1. Authenticated user ID (most reliable - cannot be spoofed).
 *   2. Composite fingerprint combining req.ip, the raw socket remote address,
 *      and the User-Agent header. This ensures that even if an attacker spoofs
 *      X-Forwarded-For (when trust proxy is misconfigured), the raw socket IP
 *      still anchors them to their real origin.
 */
const deriveRateLimitKey = (req) => {
  if (req.user?.id) {
    return `uid:${req.user.id}`;
  }

  const expressIp = req.ip || "unknown";
  const socketIp = req.socket?.remoteAddress || "unknown";
  const ua = req.headers["user-agent"] || "no-ua";

  return `ip:${expressIp}|${socketIp}|${ua}`;
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
    
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime.getTime() / 1000));

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
