import nodemailer from "nodemailer";

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}

export function getMailTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!.trim(),
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS!.trim(),
    },
  });
}

export function getMailFromAddress(): string | undefined {
  return process.env.SMTP_FROM ?? process.env.SMTP_USER;
}

/**
 * Returns a ready-to-use transporter + from address, or throws if email is not configured.
 * Use this in email-sending functions to avoid repeating the guard boilerplate.
 */
export function requireMailTransporter() {
  if (!isEmailConfigured()) {
    throw new Error("Email delivery is not configured");
  }

  const transporter = getMailTransporter();
  const from = getMailFromAddress();

  if (!transporter || !from) {
    throw new Error("Email delivery is not configured");
  }

  return { transporter, from };
}
