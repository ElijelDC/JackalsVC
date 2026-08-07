import { clubOfferTeamLabel } from "@/lib/club-offer-config";
import { sendOfferDecisionEmail } from "@/lib/offer-notify";
import type { z } from "zod";
import type { clubOfferAcceptanceSchema } from "@/lib/validations";

type ClubOfferAcceptanceData = z.infer<typeof clubOfferAcceptanceSchema>;

export async function sendClubOfferAcceptanceEmail(
  data: ClubOfferAcceptanceData,
  acceptanceId?: string,
) {
  const team = clubOfferTeamLabel(data.teamSlug);

  await sendOfferDecisionEmail({
    kind: "Club",
    decision: "accepted",
    teamLabel: team,
    fullName: data.fullName,
    email: data.email,
    textLines: [
      `Team: ${team}`,
      `Full name: ${data.fullName}`,
      `Phone: ${data.phoneNumber}`,
      `Email: ${data.email}`,
      `Preferred kit number 1: ${data.preferredKitNumber1}`,
      `Preferred kit number 2: ${data.preferredKitNumber2}`,
      `Commitment accepted: yes`,
      "Signature: attached as image in admin record / base64 on submission",
    ],
    details: [
      { label: "Team", value: team },
      { label: "Name", value: data.fullName },
      { label: "Phone", value: data.phoneNumber },
      { label: "Email", value: data.email },
      {
        label: "Kit numbers",
        value: `${data.preferredKitNumber1} / ${data.preferredKitNumber2}`,
      },
    ],
    adminPath: "/admin/club-offer-acceptances",
    recordId: acceptanceId,
    replyAudienceLabel: "player",
    footnote: "Signature is stored with the acceptance record in the database.",
  });
}
