import crypto from "crypto";
import { HttpError } from "../utils/httpError.js";
import { getSupabaseAdmin } from "../utils/supabase.js";

const ALLOWED_ALGORITHMS = ["HS256"];

const base64UrlDecode = (str) => {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf-8");
};

const constantTimeCompare = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
};

const verifyLocalJwt = (token, secret) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    const header = JSON.parse(base64UrlDecode(headerB64));

    if (!header || typeof header.alg !== "string") {
      return null;
    }

    if (!ALLOWED_ALGORITHMS.includes(header.alg)) {
      return null;
    }

    if (secret.startsWith("-----BEGIN")) {
      return null;
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    if (!constantTimeCompare(expectedSignature, signatureB64)) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(payloadB64));

    const now = Math.floor(Date.now() / 1000);

    if (typeof payload.exp === "number" && now >= payload.exp) {
      return null;
    }

    if (typeof payload.iat === "number" && now < payload.iat) {
      return null;
    }

    if (payload.iss && payload.iss !== "supabase") {
      return null;
    }

    if (payload.aud && !Array.isArray(payload.aud) && typeof payload.aud !== "string") {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
};

/**
 * Startup check: warn loudly if SUPABASE_JWT_SECRET is missing.
 * In production, this is a fatal misconfiguration - the server refuses to start.
 */
const jwtSecret = process.env.SUPABASE_JWT_SECRET;
const isProduction = process.env.NODE_ENV === "production";

if (!jwtSecret && isProduction) {
  console.error("[security] FATAL: SUPABASE_JWT_SECRET is not set in production. Set it from your Supabase project settings.");
  process.exit(1);
}

const FALLBACK_WINDOW_MS = 60_000;
const FALLBACK_MAX_REQUESTS = 10;
const fallbackRateCounts = new Map();

const isFallbackRateLimited = (ip) => {
  const now = Date.now();
  const entry = fallbackRateCounts.get(ip);

  if (!entry || now - entry.windowStart >= FALLBACK_WINDOW_MS) {
    fallbackRateCounts.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= FALLBACK_MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  return false;
};

/**
 * Express middleware that validates a Supabase JWT.
 *
 * Token source priority:
 *   1. HttpOnly cookie (`access_token`)
 *   2. Authorization header (`Bearer <token>`)
 *
 * Verification strategy:
 *   - Local HMAC-SHA256 verification (fast, zero network latency) is preferred.
 *   - Server refuses to start if SUPABASE_JWT_SECRET is missing in production.
 *   - In development, falls back to `supabase.auth.getUser()` with strict rate limiting.
 */
export const requireAuth = async (req, res, next) => {
  let token = null;

  if (req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.slice(7);
  }

  if (!token) {
    next(new HttpError(401, "Authentication required"));
    return;
  }

  if (jwtSecret) {
    const payload = verifyLocalJwt(token, jwtSecret);
    if (!payload) {
      next(new HttpError(401, "Invalid or expired session"));
      return;
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      user_metadata: payload.user_metadata,
      app_metadata: payload.app_metadata,
      role: payload.role,
    };
    return next();
  }

  console.warn("[security] Using slow network fallback for JWT verification. Do not use in production.");

  const clientIp = req.socket?.remoteAddress || req.ip || "unknown";
  if (isFallbackRateLimited(clientIp)) {
    next(new HttpError(429, "Too many verification requests. Please try again later."));
    return;
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      next(new HttpError(500, "Supabase configuration is missing for verification fallback"));
      return;
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      next(new HttpError(401, "Invalid or expired session"));
      return;
    }

    req.user = user;
    return next();
  } catch (err) {
    console.error("Auth fallback error:", err);
    next(new HttpError(500, "Internal authentication error"));
  }
};

const deriveActiveRoles = (profile) => {
  const roles = [];

  if (profile?.is_mentor) {
    roles.push("mentor");
  }

  if (profile?.is_learner) {
    roles.push("learner");
  }

  if (profile?.is_admin) {
    roles.push("admin");
  }

  return roles;
};

export const requireProfileRole = (...allowedRoles) => async (req, res, next) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      next(new HttpError(500, "Supabase configuration is missing"));
      return;
    }

    if (!req.user?.id) {
      next(new HttpError(401, "Authentication required"));
      return;
    }

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, is_mentor, is_learner, is_admin")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile authorization error:", error);
      next(new HttpError(500, "Unable to verify account permissions"));
      return;
    }

    if (!profile) {
      next(new HttpError(403, "Not authorized to access this resource"));
      return;
    }

    const activeRoles = deriveActiveRoles(profile);
    if (allowedRoles.length > 0 && !allowedRoles.some((role) => activeRoles.includes(role))) {
      next(new HttpError(403, "Not authorized to access this resource"));
      return;
    }

    req.profile = profile;
    req.roles = activeRoles;
    next();
  } catch (error) {
    console.error("Profile authorization error:", error);
    next(new HttpError(500, "Unable to verify account permissions"));
  }
};

/**
 * Shorthand middleware explicitly requiring the Admin role.
 * Any request missing the is_admin=true flag in the database will be rejected with 403.
 */
export const requireAdminRole = requireProfileRole("admin");
