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

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    if (expectedSignature !== signatureB64) {
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
 * Express middleware that validates a Supabase JWT from the Authorization header.
 * Rejects requests with no token or an invalid/expired token with 401.
 * Attaches the authenticated user object to req.user on success.
 */
export const requireAuth = async (req, res, next) => {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    next(new HttpError(500, "Supabase configuration is missing"));
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(new HttpError(401, "Authentication required"));
    return;
  }

  const token = authHeader.slice(7);
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  if (jwtSecret) {
    // Fast, local verification (0ms network latency)
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

  // Slow, fallback network verification
  console.warn("WARN: SUPABASE_JWT_SECRET is missing. Falling back to slow network-based auth verification.");
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
