// forgotPassword
// resetPassword

// backend/controllers/authController.js

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // TODO: implement logic to send reset link or OTP
    res.json({ message: `Password reset link sent to ${email}` });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process forgot password request." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    // TODO: implement logic to verify token and update password
    res.json({ message: `Password reset successful for token ${token}` });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Failed to reset password." });
  }
};
