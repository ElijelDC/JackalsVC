import { clubOfferTeamLabel } from "@/lib/club-offer-config";
import { sendOfferDecisionEmail } from "@/lib/offer-notify";
import type { z } from "zod";
import type { clubOfferDeclineSchema } from "@/lib/validations";

type ClubOfferDeclineData = z.infer<typeof clubOfferDeclineSchema>;

export async function sendClubOfferDeclineEmail(
  data: ClubOfferDeclineData,
  recordId?: string,
) {
  const team = clubOfferTeamLabel(data.teamSlug);

  await sendOfferDecisionEmail({
    kind: "Club",
    decision: "declined",
    teamLabel: team,
    fullName: data.fullName,
    email: data.email,
    textLines: [
      `Team: ${team}`,
      `Full name: ${data.fullName}`,
      `Email: ${data.email}`,
      `Phone: ${data.phoneNumber || "—"}`,
      "Decision: declined",
    ],
    details: [
      { label: "Team", value: team },
      { label: "Name", value: data.fullName },
      { label: "Email", value: data.email },
      { label: "Phone", value: data.phoneNumber || "—" },
    ],
    adminPath: "/admin/club-offer-acceptances",
    recordId,
    replyAudienceLabel: "player",
  });
}
