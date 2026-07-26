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

async function sendMensDivision2TrialsConfirmationEmail(
  data: TrialsApplicationData,
) {
  const firstName = firstNameFrom(data.fullName);

  return sendNotificationEmail({
    to: data.contactEmail,
    subject: "Jackals VC — Men's Division 2 trials",
    content: {
      heading: "Thanks for applying",
      greeting: `Hi ${firstName},`,
      paragraphs: [
        "We've received your application for the Jackals VC Men's Division 2 trials.",
        "We'll be in touch soon regarding the August trial dates.",
        "We're looking forward to seeing you on court.",
      ],
      details: [{ label: "Team", value: "Men's Division 2" }],
      footnote: TRIALS_CONFIRMATION_FOOTNOTE,
    },
  });
}

async function sendWomensDivision3TrialsConfirmationEmail(
  data: TrialsApplicationData,
) {
  const firstName = firstNameFrom(data.fullName);

  return sendNotificationEmail({
    to: data.contactEmail,
    subject: "Jackals VC — Women's Division 3 trials",
    content: {
      heading: "Thanks for applying",
      greeting: `Hi ${firstName},`,
      paragraphs: [
        "We've received your application for the Jackals VC Women's Division 3 trials.",
        "We'll be in touch through WhatsApp within the next few days with next steps.",
        "We're looking forward to seeing you on court.",
      ],
      details: [{ label: "Team", value: trialsTeamLabel(data.tryingOutFor) }],
      footnote: TRIALS_CONFIRMATION_FOOTNOTE,
    },
  });
}

/** Sends the team-specific confirmation email after a trials application is saved. */
export async function sendTrialsConfirmationEmail(
  data: TrialsApplicationData,
) {
  if (data.tryingOutFor === "MENS_DIVISION_2") {
    return sendMensDivision2TrialsConfirmationEmail(data);
  }
  if (data.tryingOutFor === "WOMENS_DIVISION_3") {
    return sendWomensDivision3TrialsConfirmationEmail(data);
  }
  return { delivered: false };
}
