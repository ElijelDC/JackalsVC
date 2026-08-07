import { afterSaveNotify } from "@/lib/offer-notify";
import { prisma } from "@/lib/prisma";
import { sendCoachOfferAcceptanceEmail } from "@/lib/send-coach-offer-acceptance-email";
import type { z } from "zod";
import type { coachOfferAcceptanceSchema } from "@/lib/validations";

type CoachOfferAcceptanceData = z.infer<typeof coachOfferAcceptanceSchema>;

export async function submitCoachOfferAcceptance(data: CoachOfferAcceptanceData) {
  const acceptance = await prisma.coachOfferAcceptance.create({
    data: {
      teamSlug: data.teamSlug,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      poloMaterial: data.poloMaterial,
      poloSize: data.poloSize,
      commitmentAccepted: data.commitmentAccepted,
      signatureDataUrl: data.signatureDataUrl,
      status: "ACCEPTED",
    },
  });

  await afterSaveNotify("coach-offer-acceptance", () =>
    sendCoachOfferAcceptanceEmail(data, acceptance.id),
  );

  return acceptance;
}
