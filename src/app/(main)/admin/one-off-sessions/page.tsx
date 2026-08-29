import { TrialSessionsManager } from "@/components/admin/TrialSessionsManager";
import { PageContainer } from "@/components/layout/PageShell";
import { listTrialSessions } from "@/lib/trial-sessions";

export const metadata = { title: "One-off sessions | Admin" };

export default async function AdminOneOffSessionsPage() {
  const sessions = await listTrialSessions();

  return (
    <PageContainer>
      <TrialSessionsManager initialSessions={sessions} />
    </PageContainer>
  );
}
