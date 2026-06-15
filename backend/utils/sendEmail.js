import nodemailer from "nodemailer";
import { env } from "../config.js";

// Stricter email validation following RFC 5321/5322 simplified rules
// Prevents accepting invalid formats like 'a@b' (no TLD) or single-character components
const isValidEmail = (value) => {
  const email = String(value).trim().toLowerCase();

  // RFC 5321/5322 simplified pattern with stricter requirements:
  // - Local part: alphanumeric, dots, hyphens, underscores, plus signs
  // - Domain: alphanumeric and hyphens, multiple levels
  // - TLD: at least 2 characters (required for valid domain)
  // The email is already normalised to lowercase above so the /i flag
  // is redundant and is intentionally omitted here.
  const emailRegex = /^[a-z0-9._%-+]+@[a-z0-9.-]+\.[a-z]{2,}$/;

  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional validation rules
  // Prevent addresses that exceed RFC 5321 limits (254 chars total, 64 chars local)
  if (email.length > 254) {
    return false;
  }

  const [localPart, domain] = email.split('@');
  if (localPart.length > 64) {
    return false;
  }

  // Prevent consecutive dots (invalid in both local and domain parts)
  if (email.includes('..')) {
    return false;
  }

  // Prevent leading or trailing dots in local part
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  // Validate each domain label individually per RFC 1035:
  // - No empty labels (consecutive dots already caught above, but defensive)
  // - No label longer than 63 characters
  // - No leading or trailing hyphen (RFC 952)
  const domainLabels = domain.split('.');
  for (const label of domainLabels) {
    if (label.length === 0 || label.length > 63) {
      return false;
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return false;
    }
  }

  return true;
};

// Ensure the reset URL uses a safe scheme before embedding it in an email.
// A javascript: or data: URL would execute in some email clients.
const isSafeUrl = (value, expectedDomain) => {
  try {
    const parsed = new URL(String(value));

    // Must be https in production
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return false;
    }

    // Must match expected frontend domain
    const allowedDomain = new URL(expectedDomain).hostname;
    if (parsed.hostname !== allowedDomain) {
      return false;
    }

    // Must begin with the reset path segment.
    // Using includes('/reset') would accept paths like /not-reset/reset
    // or /malicious/reset-trap. startsWith ensures the path is actually
    // a reset endpoint, not one that merely contains the word somewhere.
    if (!parsed.pathname.startsWith('/reset')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

export const sendEmail = async (email, url) => {
  if (!isValidEmail(email)) {
    throw new Error("sendEmail: the recipient email address is not valid.");
  }

  // Validate URL matches configured frontend domain to prevent URL injection
  const frontendUrl = process.env.PASSWORD_RESET_BASE_URL || process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error(
      "sendEmail: PASSWORD_RESET_BASE_URL or FRONTEND_URL environment variable must be set."
    );
  }

  if (!isSafeUrl(url, frontendUrl)) {
    throw new Error(
      "sendEmail: reset URL must be from the configured frontend domain."
    );
  }

  const emailUser = env.EMAIL_USER;
  const emailPass = env.EMAIL_PASS;

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
    from: emailUser,
    to: email,
    subject: "Password Reset",
    // Plain-text fallback ensures the message is accessible in text-only
    // clients and improves deliverability / spam-filter scores.
    // The reset token lives only in the URL — it is intentionally not
    // repeated as visible link text in either version.
    text: `Password Reset Request

You requested a password reset for your account. Use the link below to reset your password.

${url}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email and your password will remain unchanged.

For security reasons, do not share this link with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your account. Click the button below to reset your password.</p>
        <p>This link will expire in 1 hour.</p>

        <a href="${url}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset Password
        </a>

        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          If you did not request a password reset, please ignore this email and your password will remain unchanged.
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
          For security reasons, do not share this link with anyone. This email contains a secure token that should not be shared.
        </p>
      </div>
    `,
  });
};