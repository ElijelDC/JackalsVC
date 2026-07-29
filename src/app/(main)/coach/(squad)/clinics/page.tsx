import { CoachClinicsManager } from "@/components/coach/CoachClinicsManager";
import { requireCoachPage } from "@/lib/coach-auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Coach · Skills clinics",
};

export default async function CoachClinicsPage() {
  const { coach } = await requireCoachPage();

  const clinics = await prisma.event.findMany({
    where: {
      type: "SKILLS_CLINIC",
      trainingSessionId: null,
    },
    orderBy: { startDate: "desc" },
    take: 50,
  });

  return (
    <CoachClinicsManager
      teamName={coach.teamName}
      initialClinics={clinics.map((clinic) => ({
        id: clinic.id,
        title: clinic.title,
        description: clinic.description,
        startDate: clinic.startDate.toISOString(),
        endDate: clinic.endDate?.toISOString() ?? null,
        location: clinic.location,
        attendanceUrl: clinic.attendanceUrl,
        paymentUrl: clinic.paymentUrl,
        sessionFee: clinic.sessionFee,
        reclubUsername: clinic.reclubUsername,
      }))}
    />
  );
}
