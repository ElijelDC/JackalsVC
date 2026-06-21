import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasAttendanceAccess } from "@/lib/membership";

export default async function TrainingAttendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const trainingSession = await prisma.trainingSession.findUnique({
    where: { id },
    select: { attendanceUrl: true },
  });

  if (!trainingSession?.attendanceUrl) notFound();

  const session = await auth();
  const canAccess =
    session?.user && (await hasAttendanceAccess(session.user));

  if (!canAccess) {
    redirect("/membership");
  }

  redirect(trainingSession.attendanceUrl);
}
