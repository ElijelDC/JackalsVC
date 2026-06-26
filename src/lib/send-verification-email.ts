import { requireMailTransporter } from "@/lib/email";

export async function sendVerificationEmail(input: {
  email: string;
  code: string;
  memberName: string;
  purpose?: "registration" | "profile-change" | "password-reset";
}): Promise<{ delivered: boolean }> {
  const purpose = input.purpose ?? "registration";
  const intro =
    purpose === "profile-change"
      ? "Use this code to verify your new email address on your Jackals VC account:"
      : purpose === "password-reset"
        ? "Use this code to reset your Jackals VC password:"
        : "Use this code to verify your email and finish creating your Jackals VC account:";

  const { transporter, from } = requireMailTransporter();

  await transporter.sendMail({
    from,
    to: input.email,
    subject:
      purpose === "password-reset"
        ? "Your Jackals VC password reset code"
        : "Your Jackals VC verification code",
    text: [
      `Hi ${input.memberName},`,
      "",
      intro,
      "",
      input.code,
      "",
      "This code expires in 10 minutes.",
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: [
      `<p>Hi ${input.memberName},</p>`,
      `<p>${intro}</p>`,
      `<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${input.code}</p>`,
      "<p>This code expires in 10 minutes.</p>",
      "<p>If you did not request this, you can ignore this email.</p>",
    ].join(""),
  });

  return { delivered: true };
}

export type VerificationEmailSendError = {
  status: 429 | 503 | 500;
  message: string;
};

export function getVerificationEmailSendError(
  error: unknown,
): VerificationEmailSendError {
  if (error instanceof Error && error.message.includes("wait a minute")) {
    return { status: 429, message: error.message };
  }

  if (error instanceof Error && error.message.includes("not configured")) {
    return {
      status: 503,
      message: "Email delivery is not configured. Please contact the club.",
    };
  }

  return {
    status: 500,
    message: "Could not send verification email. Please try again.",
  };
}
