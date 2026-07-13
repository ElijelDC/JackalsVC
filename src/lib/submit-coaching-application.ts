import { prisma } from "@/lib/prisma";
import { sendCoachingApplicationEmail } from "@/lib/send-coaching-application-email";
import type { z } from "zod";
import type { coachingApplicationSchema } from "@/lib/validations";

type CoachingApplicationData = z.infer<typeof coachingApplicationSchema>;

export async function submitCoachingApplication(data: CoachingApplicationData) {
  const application = await prisma.coachingApplication.create({
    data: {
      fullName: data.fullName,
      age: data.age,
      contactNumber: data.contactNumber,
      contactEmail: data.contactEmail,
      qualificationLevel: data.qualificationLevel,
      yearsExperience: data.yearsExperience,
      canCommuteToBothVenues: data.canCommuteToBothVenues,
      whyInterested: data.whyInterested,
    },
  });

  try {
    await sendCoachingApplicationEmail(data, application.id);
  } catch (error) {
    console.error("[coaching-application] email failed after save", error);
  }

  return application;
}
