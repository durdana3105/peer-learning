import express from "express";
import { forgotPassword, resetPassword } from "../controllers/authController.js";
import {
	forgotPasswordRateLimiter,
	loginRateLimiter,
	otpVerificationRateLimiter,
	resetPasswordRateLimiter,
	signupRateLimiter,
} from "../middlewares/rateLimiter.js";

const router = express.Router();

export const authRouteRateLimiters = {
	loginRateLimiter,
	signupRateLimiter,
	otpVerificationRateLimiter,
};

router.post("/forgot-password", forgotPasswordRateLimiter, forgotPassword);
router.post("/reset-password/:token", resetPasswordRateLimiter, resetPassword);

export default router;