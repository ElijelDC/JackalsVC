import { TrialSessionsManager } from "@/components/admin/TrialSessionsManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { listTrialSessions } from "@/lib/trial-sessions";

export const metadata = { title: "One-off sessions | Admin" };

export default async function AdminOneOffSessionsPage() {
  const sessions = await listTrialSessions();

  return (
    <PageContainer>
      <PageHeader
        title="One-off sessions"
        description="Create private one-off sessions and share the link — people register with email and name without needing an account."
      />
      <TrialSessionsManager initialSessions={sessions} />
    </PageContainer>
  );
}
