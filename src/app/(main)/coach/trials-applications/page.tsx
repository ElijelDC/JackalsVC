import { TrialsApplicationsManager } from "@/components/admin/TrialsApplicationsManager";
import { CoachShell } from "@/components/coach/CoachShell";
import { requireCoachPage } from "@/lib/coach-auth";
import { listTrialsApplications } from "@/lib/trials-applications";

export const metadata = { title: "Trials applications" };

export default async function CoachTrialsApplicationsPage() {
  const { coach } = await requireCoachPage("/coach/trials-applications");
  const applications = await listTrialsApplications();
  const teamLabel =
    coach.teams.length > 1
      ? coach.teams.map((team) => team.name).join(" · ")
      : coach.teamName;

  return (
    <CoachShell teamName={teamLabel}>
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold text-white">
          Trials applications
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Review National League trial sign-ups and download the spreadsheet.
        </p>
      </div>
      <TrialsApplicationsManager
        initialApplications={applications}
        listApiPath="/api/coach/trials-applications"
        actionApiPath="/api/coach/trials-applications"
        exportApiPath="/api/coach/trials-applications/export"
      />
    </CoachShell>
  );
}
