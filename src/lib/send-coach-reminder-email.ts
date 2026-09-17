import { requireMailTransporter } from "@/lib/email";

export async function sendTrainingResponseReminderEmail(input: {
  email: string;
  playerName: string;
  teamName: string;
  sessionLabel: string;
  sessionUrl: string;
  kind?: "training" | "match";
}): Promise<{ delivered: boolean }> {
  const kind = input.kind ?? "training";
  const itemLabel = kind === "match" ? "match" : "training";
  const respondLabel =
    kind === "match" ? "Respond to match" : "Respond to training";
  const teamLabel = input.teamName.trim() || "Jackals";

  const { transporter, from } = requireMailTransporter();

  const subject = `${itemLabel === "match" ? "Match" : "Training"} reminder — ${teamLabel}`;
  const text = [
    `Hi ${input.playerName},`,
    "",
    `Reminder: please respond for this upcoming ${teamLabel} ${itemLabel}:`,
    "",
    input.sessionLabel,
    "",
    `Respond here: ${input.sessionUrl}`,
    "",
    "Thanks,",
    "Jackals VC",
  ].join("\n");

  const html = [
    `<p>Hi ${input.playerName},</p>`,
    `<p>Reminder: please respond for this upcoming <strong>${teamLabel}</strong> ${itemLabel}:</p>`,
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
