import { prisma } from "@/lib/prisma";
import { sendCommitteeInterestEmail } from "@/lib/send-committee-interest-email";
import type { z } from "zod";
import type { committeeInterestSchema } from "@/lib/validations";

type CommitteeInterestData = z.infer<typeof committeeInterestSchema>;

export async function submitCommitteeInterest(data: CommitteeInterestData) {
  const interest = await prisma.committeeInterest.create({
    data: {
      fullName: data.fullName,
      roleInterest1: data.roleInterest1,
      roleInterest2: data.roleInterest2,
      roleInterest3: data.roleInterest3,
    },
  });

  try {
    await sendCommitteeInterestEmail(data, interest.id);
  } catch (error) {
    console.error("[committee-interest] email failed after save", error);
  }

  return interest;
}
