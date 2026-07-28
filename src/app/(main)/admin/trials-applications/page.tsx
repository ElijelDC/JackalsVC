import { TrialsApplicationsManager } from "@/components/admin/TrialsApplicationsManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { listTrialsApplications } from "@/lib/trials-applications";

export const metadata = { title: "Trials applications | Admin" };

export default async function AdminTrialsApplicationsPage() {
  const applications = await listTrialsApplications();

  return (
    <PageContainer>
      <PageHeader
        title="Trials applications"
        description="Filter by team, position, or status — download a spreadsheet or switch between list, cards, and compact views."
      />
      <TrialsApplicationsManager initialApplications={applications} />
    </PageContainer>
  );
}
