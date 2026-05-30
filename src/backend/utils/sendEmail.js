import nodemailer from "nodemailer";

// Basic email format check — catches the most common malformed inputs
// before a network call is made.
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));

// Ensure the reset URL uses a safe scheme before embedding it in an email.
// A javascript: or data: URL would execute in some email clients.
const isSafeUrl = (value) => {
  try {
    const parsed = new URL(String(value));
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export const sendEmail = async (email, url) => {
  if (!isValidEmail(email)) {
    throw new Error("sendEmail: the recipient email address is not valid.");
  }

  if (!isSafeUrl(url)) {
    throw new Error(
      "sendEmail: the reset URL must be a valid http or https URL."
    );
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASS environment variables must be set before sending email."
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  await transporter.sendMail({
    from: `"Peer Learning" <${emailUser}>`,
    to: email,
    subject: "Password Reset",
    html: `
      <p>You requested a password reset for your Peer Learning account.</p>
      <p>Click the link below to reset your password. This link is single-use.</p>
      <p><a href="${url}" style="color:#4f9cf9;">Reset my password</a></p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `,
  });
};
