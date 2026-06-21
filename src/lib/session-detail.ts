import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveUpcomingAttendanceUrl } from "@/lib/training-events";
import type { SessionCategory } from "@/lib/training-utils";

export async function getPublicSession(id: string, category: SessionCategory) {
  const session = await prisma.trainingSession.findFirst({
    where: { id, category },
  });

  if (!session) notFound();

  return session;
}

export async function getSessionAttendanceContext(
  id: string,
  category: SessionCategory,
) {
  const session = await getPublicSession(id, category);
  const { url, occurrenceDate } = await resolveUpcomingAttendanceUrl(session);

  return {
    session,
    attendanceUrl: url,
    attendanceOccurrenceDate: occurrenceDate?.toISOString() ?? null,
  };
}
