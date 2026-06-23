import { getMailFromAddress, getMailTransporter, isEmailConfigured } from "@/lib/email";

export async function sendTrainingResponseReminderEmail(input: {
  email: string;
  playerName: string;
  coachName: string;
  teamName: string;
  sessionLabel: string;
  sessionUrl: string;
  kind?: "training" | "match";
}): Promise<{ delivered: boolean }> {
  const kind = input.kind ?? "training";
  const itemLabel = kind === "match" ? "match" : "training";
  const respondLabel = kind === "match" ? "Respond to match" : "Respond to training";

  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[coach reminder] ${input.playerName} <${input.email}> — ${input.sessionLabel} → ${input.sessionUrl}`,
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

  const subject = `${itemLabel === "match" ? "Match" : "Training"} response needed — ${input.teamName}`;
  const text = [
    `Hi ${input.playerName},`,
    "",
    `${input.coachName} is waiting for your attendance response for an upcoming ${itemLabel}:`,
    "",
    input.sessionLabel,
    "",
    `Please respond here: ${input.sessionUrl}`,
    "",
    "Thanks,",
    "Jackals VC",
  ].join("\n");

  const html = [
    `<p>Hi ${input.playerName},</p>`,
    `<p><strong>${input.coachName}</strong> is waiting for your attendance response for an upcoming <strong>${input.teamName}</strong> ${itemLabel}:</p>`,
    `<p>${input.sessionLabel}</p>`,
    `<p><a href="${input.sessionUrl}">${respondLabel}</a></p>`,
    "<p>Thanks,<br>Jackals VC</p>",
  ].join("");

  await transporter.sendMail({
    from,
    to: input.email,
    subject,
    text,
    html,
  });

  return { delivered: true };
}
