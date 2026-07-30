import { TrialsApplicationsManager } from "@/components/admin/TrialsApplicationsManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { listTrialsApplications } from "@/lib/trials-applications";

export const metadata = { title: "Signups" };

export default async function CoachTrialsApplicationsPage() {
  const applications = await listTrialsApplications();

  return (
    <PageContainer>
      <PageHeader
        title="Signups"
        description="Review sign-ups and export to Excel."
      />
      <TrialsApplicationsManager
        initialApplications={applications}
        listApiPath="/api/coach/trials-applications"
        actionApiPath="/api/coach/trials-applications"
        exportApiPath="/api/coach/trials-applications/export"
        canDeleteApplications
      />
    </PageContainer>
  );
}
