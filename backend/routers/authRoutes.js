import express from "express";
import { getSupabaseAdmin } from "../utils/supabase.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

/**
 * POST /api/auth/set-cookie
 *
 * SECURITY: Validates the Supabase JWT before setting it as an HttpOnly cookie.
 * Prevents session hijacking attacks where attackers could set arbitrary tokens.
 *
 * Rate limited to prevent token spamming attacks.
 */
router.post("/set-cookie", rateLimiter, async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ error: "access_token is required" });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // SECURITY: Validate the token with Supabase before setting it as a cookie
    // This prevents attackers from setting arbitrary tokens and hijacking sessions
    const { data, error } = await supabaseAdmin.auth.getUser(access_token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Set as HttpOnly, Secure, SameSite Strict to prevent XSS and CSRF
    res.cookie("access_token", access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600 * 1000 * 24 * 7, // 7 days
      path: "/",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error validating token in set-cookie:", error);
    return res.status(500).json({ error: "Failed to validate token" });
  }
});

/**
 * POST /api/auth/clear-cookie
 *
 * Clears the HttpOnly authentication cookie.
 * Rate limited to prevent abuse.
 */
router.post("/clear-cookie", rateLimiter, (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  res.json({ success: true });
});

export default router;
