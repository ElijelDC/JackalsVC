import { CoachingApplicationsManager } from "@/components/admin/CoachingApplicationsManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { serializeCoachingApplication } from "@/lib/coaching-application-config";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Coaching applications | Admin" };

export default async function AdminCoachingApplicationsPage() {
  const applications = await prisma.coachingApplication.findMany({
    where: { status: "NEW" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Coaching applications"
        description="Review applications submitted from the Coach With Us page."
      />
      <CoachingApplicationsManager
        initialApplications={applications.map(serializeCoachingApplication)}
      />
    </PageContainer>
  );
}
