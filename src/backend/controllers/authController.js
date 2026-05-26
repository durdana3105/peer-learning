export const forgotPassword = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Forgot password endpoint working",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Reset password endpoint working",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};