import { afterSaveNotify } from "@/lib/offer-notify";
import { prisma } from "@/lib/prisma";
import { sendCoachOfferDeclineEmail } from "@/lib/send-coach-offer-decline-email";
import type { z } from "zod";
import type { coachOfferDeclineSchema } from "@/lib/validations";

type CoachOfferDeclineData = z.infer<typeof coachOfferDeclineSchema>;

export async function submitCoachOfferDecline(data: CoachOfferDeclineData) {
  const record = await prisma.coachOfferAcceptance.create({
    data: {
      teamSlug: data.teamSlug,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber ?? "",
      email: data.email,
      commitmentAccepted: false,
      signatureDataUrl: "",
      status: "DECLINED",
    },
  });

  await afterSaveNotify("coach-offer-decline", () =>
    sendCoachOfferDeclineEmail(data, record.id),
  );

  return record;
}
