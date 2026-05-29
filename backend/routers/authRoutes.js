import express from "express";
import { forgotPassword, resetPassword } from "../controllers/authController.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/forgot-password", rateLimiter, forgotPassword);
router.post("/reset-password/:token", rateLimiter, resetPassword);
// Example route
router.post("/login", rateLimiter, (req, res) => {
  res.json({ message: "Login route working" });
});

export default router;