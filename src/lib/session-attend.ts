import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasAttendanceAccess } from "@/lib/membership";
import { resolveOccurrenceAttendanceUrl } from "@/lib/training-occurrence";
import { resolveUpcomingAttendanceUrl } from "@/lib/training-events";
import { SESSION_CATEGORIES, type SessionCategory } from "@/lib/training-utils";

export async function redirectToSessionAttendance(
  id: string,
  category: SessionCategory,
  date?: string,
) {
  const trainingSession = await prisma.trainingSession.findFirst({
    where: { id, category },
  });

  if (!trainingSession) notFound();

  const attendanceUrl = date
    ? await resolveOccurrenceAttendanceUrl(
        id,
        new Date(date),
        trainingSession.attendanceUrl,
      )
    : (await resolveUpcomingAttendanceUrl(trainingSession)).url;

  if (!attendanceUrl) notFound();

  if (category !== SESSION_CATEGORIES.FUN) {
    const session = await auth();
    const canAccess =
      session?.user && (await hasAttendanceAccess(session.user));

    if (!canAccess) {
      redirect("/membership");
    }
  }

  redirect(attendanceUrl);
}
