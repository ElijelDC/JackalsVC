import "server-only";

import type { TrialsApplicationStatus } from "@/lib/trials-application-config";
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
  options?: {
    allowedCurrentStatuses?: TrialsApplicationStatus[];
  },
) {
  const allowedCurrentStatuses = options?.allowedCurrentStatuses ?? ["NEW"];

  const application = await prisma.trialsApplication.findUnique({
    where: { id },
  });

  if (!application) {
    return { error: "not_found" as const };
  }

  if (
    !allowedCurrentStatuses.includes(
      application.status as TrialsApplicationStatus,
    )
  ) {
    return { error: "invalid_status" as const };
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

export async function deleteDismissedTrialsApplication(id: string) {
  const application = await prisma.trialsApplication.findUnique({
    where: { id },
  });

  if (!application) {
    return { error: "not_found" as const };
  }

  if (application.status !== "DISMISSED") {
    return { error: "not_dismissed" as const };
  }

  await prisma.trialsApplication.delete({ where: { id } });

  return { success: true as const };
}
