import { requireCoachPage } from "@/lib/coach-auth";
import { CoachShell } from "@/components/coach/CoachShell";

export default async function CoachSquadLayout({
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
