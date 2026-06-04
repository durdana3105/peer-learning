import express from "express";

const router = express.Router();

router.post("/set-cookie", (req, res) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(400).json({ error: "access_token is required" });
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
});

router.post("/clear-cookie", (req, res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  res.json({ success: true });
});

export default router;
