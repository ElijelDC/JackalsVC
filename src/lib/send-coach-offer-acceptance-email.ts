import {
  coachOfferTeamLabel,
  coachPoloMaterialLabel,
} from "@/lib/coach-offer-config";
import { sendOfferDecisionEmail } from "@/lib/offer-notify";
import type { z } from "zod";
import type { coachOfferAcceptanceSchema } from "@/lib/validations";

type CoachOfferAcceptanceData = z.infer<typeof coachOfferAcceptanceSchema>;

export async function sendCoachOfferAcceptanceEmail(
  data: CoachOfferAcceptanceData,
  acceptanceId?: string,
) {
  const team = coachOfferTeamLabel(data.teamSlug);
  const polo = `${coachPoloMaterialLabel(data.poloMaterial)} · ${data.poloSize}`;

  await sendOfferDecisionEmail({
    kind: "Coach",
    decision: "accepted",
    teamLabel: team,
    fullName: data.fullName,
    email: data.email,
    textLines: [
      `Team: ${team}`,
      `Full name: ${data.fullName}`,
      `Phone: ${data.phoneNumber}`,
      `Email: ${data.email}`,
      `Coach polo: ${polo}`,
      `Commitment accepted: yes`,
      "Signature: attached as image in admin record / base64 on submission",
    ],
    details: [
      { label: "Team", value: team },
      { label: "Name", value: data.fullName },
      { label: "Phone", value: data.phoneNumber },
      { label: "Email", value: data.email },
      { label: "Coach polo", value: polo },
    ],
    adminPath: "/admin/coach-offer-acceptances",
    recordId: acceptanceId,
    replyAudienceLabel: "coach",
    footnote: "Signature is stored with the acceptance record in the database.",
  });
}
