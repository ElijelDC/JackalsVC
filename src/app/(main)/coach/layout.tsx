import { requireCoachPage } from "@/lib/coach-auth";
import { CoachShell } from "@/components/coach/CoachShell";
import { adminPageMetadata } from "@/lib/seo";

export const metadata = adminPageMetadata("Coach");

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { coach } = await requireCoachPage();
  const teamLabel =
    coach.teams.length > 1
      ? coach.teams.map((team) => team.name).join(" · ")
      : coach.teamName;

  return <CoachShell teamName={teamLabel}>{children}</CoachShell>;
}
