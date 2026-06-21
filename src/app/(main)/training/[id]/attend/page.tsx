import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasAttendanceAccess } from "@/lib/membership";
import { resolveOccurrenceAttendanceUrl } from "@/lib/training-occurrence";

export default async function TrainingAttendPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date } = await searchParams;

  const trainingSession = await prisma.trainingSession.findUnique({
    where: { id },
    select: { attendanceUrl: true },
  });

  if (!trainingSession) notFound();

  const attendanceUrl = date
    ? await resolveOccurrenceAttendanceUrl(
        id,
        new Date(date),
        trainingSession.attendanceUrl,
      )
    : trainingSession.attendanceUrl;

  if (!attendanceUrl) notFound();

  const session = await auth();
  const canAccess =
    session?.user && (await hasAttendanceAccess(session.user));

  if (!canAccess) {
    redirect("/membership");
  }

  redirect(attendanceUrl);
}
