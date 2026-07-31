import { TrialSessionsManager } from "@/components/admin/TrialSessionsManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { listTrialSessions } from "@/lib/trial-sessions";

export const metadata = { title: "Trial sessions | Admin" };

export default async function AdminTrialSessionsPage() {
  const sessions = await listTrialSessions();

  return (
    <PageContainer>
      <PageHeader
        title="Trial sessions"
        description="Create private one-off trial sessions. Share the link with prospective players — they register with email and name without needing an account."
      />
      <TrialSessionsManager initialSessions={sessions} />
    </PageContainer>
  );
}
