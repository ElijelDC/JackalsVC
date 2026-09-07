import { afterSaveNotify } from "@/lib/offer-notify";
import { prisma } from "@/lib/prisma";
import { sendClubOfferAcceptanceEmail } from "@/lib/send-club-offer-acceptance-email";
import type { z } from "zod";
import type { clubOfferAcceptanceSchema } from "@/lib/validations";

type ClubOfferAcceptanceData = z.infer<typeof clubOfferAcceptanceSchema>;

export async function submitClubOfferAcceptance(data: ClubOfferAcceptanceData) {
  const acceptance = await prisma.clubOfferAcceptance.create({
    data: {
      teamSlug: data.teamSlug,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      preferredKitNumber1: null,
      preferredKitNumber2: null,
      commitmentAccepted: data.commitmentAccepted,
      signatureDataUrl: data.signatureDataUrl,
      status: "ACCEPTED",
    },
  });

  await afterSaveNotify("club-offer-acceptance", () =>
    sendClubOfferAcceptanceEmail(data, acceptance.id),
  );

  return acceptance;
}
