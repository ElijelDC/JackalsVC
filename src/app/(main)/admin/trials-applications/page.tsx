import { TrialsApplicationsManager } from "@/components/admin/TrialsApplicationsManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { listTrialsApplications } from "@/lib/trials-applications";

export const metadata = { title: "Signups | Admin" };

export default async function AdminTrialsApplicationsPage() {
  const applications = await listTrialsApplications();

  return (
    <PageContainer>
      <PageHeader
        title="Signups"
        description="Review sign-ups, email applicants, filter by team or position, and export to Excel."
      />
      <TrialsApplicationsManager
        initialApplications={applications}
        canDeleteApplications
        canEmailApplicants
      />
    </PageContainer>
  );
}
