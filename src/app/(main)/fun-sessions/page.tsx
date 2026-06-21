import { getVisibleFunSessions } from "@/lib/session-calendar";
import { SessionListPage } from "@/components/training/SessionListPage";

export const metadata = {
  title: "Fun Sessions",
};

export default async function FunSessionsPage() {
  const sessions = await getVisibleFunSessions();

  return (
    <SessionListPage
      sessions={sessions}
      detailBasePath="/fun-sessions"
      title="Fun Sessions"
      description="Open social volleyball sessions for everyone. Pay the session fee and register on Reclub — no sign-in required."
      emptyTitle="No fun sessions scheduled yet"
      emptyDescription="Fun session times will be posted here soon. Check back later."
    />
  );
}
