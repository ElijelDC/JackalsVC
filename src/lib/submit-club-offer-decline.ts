import { afterSaveNotify } from "@/lib/offer-notify";
import { prisma } from "@/lib/prisma";
import { sendClubOfferDeclineEmail } from "@/lib/send-club-offer-decline-email";
import type { z } from "zod";
import type { clubOfferDeclineSchema } from "@/lib/validations";

type ClubOfferDeclineData = z.infer<typeof clubOfferDeclineSchema>;

export async function submitClubOfferDecline(data: ClubOfferDeclineData) {
  const record = await prisma.clubOfferAcceptance.create({
    data: {
      teamSlug: data.teamSlug,
      fullName: data.fullName,
      phoneNumber: data.phoneNumber ?? "",
      email: data.email,
      preferredKitNumber1: null,
      preferredKitNumber2: null,
      commitmentAccepted: false,
      signatureDataUrl: "",
      status: "DECLINED",
    },
  });

  await afterSaveNotify("club-offer-decline", () =>
    sendClubOfferDeclineEmail(data, record.id),
  );

  return record;
}
