import { getMailFromAddress, getMailTransporter, isEmailConfigured } from "@/lib/email";

export async function sendVerificationEmail(input: {
  email: string;
  code: string;
  memberName: string;
}): Promise<{ delivered: boolean }> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[email verification] Code for ${input.email} (${input.memberName}): ${input.code}`,
      );
      return { delivered: false };
    }
    throw new Error("Email delivery is not configured");
  }

  const transporter = getMailTransporter();
  const from = getMailFromAddress();

  if (!transporter || !from) {
    throw new Error("Email delivery is not configured");
  }

  await transporter.sendMail({
    from,
    to: input.email,
    subject: "Your Jackals VC verification code",
    text: [
      `Hi ${input.memberName},`,
      "",
      "Use this code to verify your email and finish creating your Jackals VC account:",
      "",
      input.code,
      "",
      "This code expires in 10 minutes.",
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: [
      `<p>Hi ${input.memberName},</p>`,
      "<p>Use this code to verify your email and finish creating your Jackals VC account:</p>",
      `<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${input.code}</p>`,
      "<p>This code expires in 10 minutes.</p>",
      "<p>If you did not request this, you can ignore this email.</p>",
    ].join(""),
  });

  return { delivered: true };
}
