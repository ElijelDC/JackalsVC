import { CoachingApplicationsManager } from "@/components/admin/CoachingApplicationsManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { serializeCoachingApplication } from "@/lib/coaching-application-config";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Coaching applications | Admin" };

export default async function AdminCoachingApplicationsPage() {
  const applications = await prisma.coachingApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Coaching applications"
        description="Filter by coach level, commute, or status — switch between cards and compact views."
      />
      <CoachingApplicationsManager
        initialApplications={applications.map(serializeCoachingApplication)}
      />
    </PageContainer>
  );
}
