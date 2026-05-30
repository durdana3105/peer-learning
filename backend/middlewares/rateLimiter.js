const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX_REQUESTS = 20;

const requestBuckets = new Map();

const getRequestIdentity = (req) => {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }

  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor || "").split(",")[0];

  const ipAddress = forwardedIp?.trim() || req.ip || req.socket?.remoteAddress || "unknown";
  return `ip:${ipAddress}`;
};

const sweepExpiredBuckets = (windowMs) => {
  const now = Date.now();

  for (const [key, bucket] of requestBuckets.entries()) {
    if (now - bucket.windowStart >= windowMs) {
      requestBuckets.delete(key);
    }
  }
};

export const createRateLimiter = ({
  windowMs = DEFAULT_WINDOW_MS,
  maxRequests = DEFAULT_MAX_REQUESTS,
  keyPrefix = "global",
  message = "Too many requests. Please wait before trying again.",
} = {}) => {
  return (req, res, next) => {
    sweepExpiredBuckets(windowMs);

    const now = Date.now();
    const bucketKey = `${keyPrefix}:${getRequestIdentity(req)}`;
    const bucket = requestBuckets.get(bucketKey);

    if (!bucket || now - bucket.windowStart >= windowMs) {
      requestBuckets.set(bucketKey, { count: 1, windowStart: now });
      return next();
    }

    if (bucket.count >= maxRequests) {
      return res.status(429).json({ error: message });
    }

    bucket.count += 1;
    next();
  };
};

export const loginRateLimiter = createRateLimiter({
  keyPrefix: "login",
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: "Too many login attempts. Please wait before trying again.",
});

export const signupRateLimiter = createRateLimiter({
  keyPrefix: "signup",
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  message: "Too many signup attempts. Please wait before trying again.",
});

export const forgotPasswordRateLimiter = createRateLimiter({
  keyPrefix: "forgot-password",
  windowMs: 15 * 60 * 1000,
  maxRequests: 3,
  message: "Too many password reset attempts. Please wait before trying again.",
});

export const resetPasswordRateLimiter = createRateLimiter({
  keyPrefix: "reset-password",
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: "Too many password reset attempts. Please wait before trying again.",
});

export const otpVerificationRateLimiter = createRateLimiter({
  keyPrefix: "otp-verification",
  windowMs: 10 * 60 * 1000,
  maxRequests: 5,
  message: "Too many verification attempts. Please wait before trying again.",
});

export const protectedApiRateLimiter = createRateLimiter({
  keyPrefix: "protected-api",
  windowMs: 60 * 1000,
  maxRequests: 20,
  message: "Too many requests. Please wait before sending more messages.",
});const WINDOW_MS = 60 * 1000;
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
