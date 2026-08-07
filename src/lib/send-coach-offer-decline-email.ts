import { coachOfferTeamLabel } from "@/lib/coach-offer-config";
import { sendOfferDecisionEmail } from "@/lib/offer-notify";
import type { z } from "zod";
import type { coachOfferDeclineSchema } from "@/lib/validations";

type CoachOfferDeclineData = z.infer<typeof coachOfferDeclineSchema>;

export async function sendCoachOfferDeclineEmail(
  data: CoachOfferDeclineData,
  recordId?: string,
) {
  const team = coachOfferTeamLabel(data.teamSlug);

  await sendOfferDecisionEmail({
    kind: "Coach",
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
    adminPath: "/admin/coach-offer-acceptances",
    recordId,
    replyAudienceLabel: "coach",
  });
}
