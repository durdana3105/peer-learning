const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20;

// requestCounts tracks the active rate-limit window for each authenticated user.
// Without periodic cleanup the Map grows without bound: every user that ever
// sends a request adds an entry that is never removed, which is a slow memory
// leak in a long-running Node.js process.
export const requestCounts = new Map();

// evictStaleEntries removes entries whose time window has already expired.
// Called before each limiter check so the Map stays bounded to only users
// who are currently within an active window.
const evictStaleEntries = () => {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (now - entry.windowStart >= WINDOW_MS) {
      requestCounts.delete(key);
    }
  }
};

export const rateLimiter = (req, res, next) => {
  const userId = req.user.id;
  const now = Date.now();

  evictStaleEntries();

  const entry = requestCounts.get(userId);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
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
