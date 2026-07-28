import "server-only";

import { prisma } from "@/lib/prisma";
import { serializeTrialsApplication } from "@/lib/trials-application-config";

export async function listTrialsApplications() {
  const applications = await prisma.trialsApplication.findMany({
    orderBy: { createdAt: "desc" },
  });
  return applications.map(serializeTrialsApplication);
}

export async function updateTrialsApplicationStatus(
  id: string,
  action: "review" | "dismiss",
  reviewedByUserId: string,
) {
  const application = await prisma.trialsApplication.findUnique({
    where: { id },
  });

  if (!application) {
    return { error: "not_found" as const };
  }

  if (application.status !== "NEW") {
    return { error: "not_new" as const };
  }

  const updated = await prisma.trialsApplication.update({
    where: { id },
    data: {
      status: action === "review" ? "REVIEWED" : "DISMISSED",
      reviewedAt: new Date(),
      reviewedByUserId,
    },
  });

  return {
    application: serializeTrialsApplication(updated),
  };
}
