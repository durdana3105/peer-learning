import express from "express";
import { forgotPassword, resetPassword } from "../controllers/authController.js";

const router = express.Router();

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
// Example route
router.post("/login", (req, res) => {
  res.json({ message: "Login route working" });
});

export default router;