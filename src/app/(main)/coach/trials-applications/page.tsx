import { TrialsApplicationsManager } from "@/components/admin/TrialsApplicationsManager";
import { requireCoachPage } from "@/lib/coach-auth";
import { listTrialsApplications } from "@/lib/trials-applications";

export const metadata = { title: "Trials applications" };

export default async function CoachTrialsApplicationsPage() {
  await requireCoachPage("/coach/trials-applications");
  const applications = await listTrialsApplications();

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">
          Trials applications
        </h1>
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
    </>
  );
}
