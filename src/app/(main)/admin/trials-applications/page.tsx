import { TrialsApplicationsManager } from "@/components/admin/TrialsApplicationsManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { serializeTrialsApplication } from "@/lib/trials-application-config";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Trials applications | Admin" };

export default async function AdminTrialsApplicationsPage() {
  const applications = await prisma.trialsApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Trials applications"
        description="Filter by team, position, or status — switch between list, cards, and compact views."
      />
      <TrialsApplicationsManager
        initialApplications={applications.map(serializeTrialsApplication)}
      />
    </PageContainer>
  );
}
