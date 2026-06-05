import crypto from "crypto";
import { HttpError } from "../utils/httpError.js";
import { getSupabaseAdmin } from "../utils/supabase.js";

const base64UrlDecode = (str) => {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return Buffer.from(str, "base64").toString("utf-8");
};

const verifyLocalJwt = (token, secret) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    const header = JSON.parse(base64UrlDecode(headerB64));
    
    // Prevent algorithm confusion: Only process HS256 tokens using HMAC.
    if (header.alg !== "HS256") {
      return null;
    }
    
    // Additional check: if the secret appears to be a PEM-encoded public key, reject HMAC
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

    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signatureB64);

    if (
      expectedSignatureBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(expectedSignatureBuffer, signatureBuffer)
    ) {
      return null;
    }

    const payload = JSON.parse(base64UrlDecode(payloadB64));

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
};

/**
 * Startup check: warn loudly if SUPABASE_JWT_SECRET is missing.
 * In production, this is a fatal misconfiguration — the server refuses to start.
 */
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!jwtSecret) {
  if (process.env.NODE_ENV === "production") {
    console.error("[security] FATAL: SUPABASE_JWT_SECRET is not set. Local JWT verification is required in production.");
    process.exit(1);
  }
  console.warn("[security] WARNING: SUPABASE_JWT_SECRET is not set. Using slow network-based auth (dev only).");
}

/**
 * Simple rate limiter specifically for the network fallback path.
 * Prevents attackers from spamming invalid tokens to exhaust Supabase API quotas.
 */
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
 *   - Production: Local HMAC-SHA256 verification only (fast, zero network latency).
 *     Server refuses to start if SUPABASE_JWT_SECRET is missing.
 *   - Development: Falls back to Supabase getUser() if the secret is absent,
 *     with a strict per-IP rate limiter to prevent API exhaustion.
 */
export const requireAuth = async (req, res, next) => {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    next(new HttpError(500, "Supabase configuration is missing"));
    return;
  }

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

  // PRIMARY PATH: Fast, local HMAC verification (0ms network latency)
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
      role: payload.role
    };
    return next();
  }

  // FALLBACK PATH (development only — production exits at startup above)
  // Rate-limit this path to prevent Supabase API quota exhaustion from token spam.
  const clientIp = req.socket?.remoteAddress || req.ip || "unknown";
  if (isFallbackRateLimited(clientIp)) {
    next(new HttpError(429, "Too many authentication attempts. Please try again later."));
    return;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    next(new HttpError(401, "Invalid or expired session"));
    return;
  }

  req.user = data.user;
  next();
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
