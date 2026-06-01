import { createClient } from "@supabase/supabase-js";
import { HttpError } from "../utils/httpError.js";

let supabaseInstance = null;

const getSupabaseAdmin = () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
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
      .select("id, is_mentor, is_learner")
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
