const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20;
const MAX_ENTRIES = 10000;
const CLEANUP_INTERVAL_MS = 60 * 1000;

/**
 * Derives a rate-limit key for the current request.
 *
 * Priority:
 *   1. Authenticated user ID (most reliable — cannot be spoofed).
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

    if (now - cleanupTime >= CLEANUP_INTERVAL_MS) {
      for (const [k, entry] of store.entries()) {
        if (now - entry.windowStart >= windowMs) {
          store.delete(k);
        }
      }
      cleanupTime = now;
    }

    let entry = store.get(key);

    if (!entry || now - entry.windowStart >= windowMs) {
      if (!entry && store.size >= maxEntries) {
        const oldestKey = store.keys().next().value;
        if (oldestKey !== undefined) {
          store.delete(oldestKey);
        }
      }
      store.set(key, { count: 1, windowStart: now });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({
        error: "Too many requests. Please wait before sending more messages.",
      });
    }

    entry.count += 1;
    next();
  };
};

export const rateLimiter = createRateLimiter();
export const protectedApiRateLimiter = rateLimiter;
