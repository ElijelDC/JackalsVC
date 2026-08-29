import { sendNotificationEmail } from "@/lib/notify";
import { trialsTeamLabel } from "@/lib/trials-recruitment-config";
import type { z } from "zod";
import type { trialsApplicationSchema } from "@/lib/validations";

type TrialsApplicationData = z.infer<typeof trialsApplicationSchema>;

const TRIALS_CONFIRMATION_FOOTNOTE =
  "Jackals Volleyball Club — main trainings at Meakstown Community Centre; extra training and matchdays at Luttrellstown Community Centre.";

function firstNameFrom(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

/** Sends the team-specific confirmation email after a trials application is saved. */
export async function sendTrialsConfirmationEmail(
  data: TrialsApplicationData,
) {
  const teamLabel = trialsTeamLabel(data.tryingOutFor);
  const firstName = firstNameFrom(data.fullName);

  return sendNotificationEmail({
    to: data.contactEmail,
    subject: `Jackals VC — ${teamLabel} trials`,
    content: {
      heading: "Thanks for applying",
      greeting: `Hi ${firstName},`,
      paragraphs: [
        `We've received your signup for the Jackals VC ${teamLabel} trials.`,
        "We'll be in touch soon regarding the August trial dates.",
        "We're looking forward to seeing you on court.",
      ],
      details: [{ label: "Team", value: teamLabel }],
      footnote: TRIALS_CONFIRMATION_FOOTNOTE,
    },
  });
}
