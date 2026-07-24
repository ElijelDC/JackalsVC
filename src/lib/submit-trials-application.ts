import { prisma } from "@/lib/prisma";
import { sendTrialsConfirmationEmail } from "@/lib/send-trials-application-email";
import type { z } from "zod";
import type { trialsApplicationSchema } from "@/lib/validations";

type TrialsApplicationData = z.infer<typeof trialsApplicationSchema>;

export async function submitTrialsApplication(data: TrialsApplicationData) {
  const application = await prisma.trialsApplication.create({
    data: {
      tryingOutFor: data.tryingOutFor,
      fullName: data.fullName,
      age: data.age,
      contactEmail: data.contactEmail,
      contactNumber: data.contactNumber,
      yearsExperience: data.yearsExperience,
      inlDivision: data.inlDivision,
      inlDivisionOther:
        data.inlDivision === "OTHER" ? (data.inlDivisionOther ?? null) : null,
      inlTeamName:
        data.inlDivision !== "NONE" ? (data.inlTeamName ?? null) : null,
      preferredPosition1: data.preferredPosition1,
      preferredPosition2: data.preferredPosition2,
    },
  });

  try {
    await sendTrialsConfirmationEmail(data);
  } catch (error) {
    console.error(
      "[trials-application] confirmation email failed after save",
      error,
    );
  }

  return application;
}
