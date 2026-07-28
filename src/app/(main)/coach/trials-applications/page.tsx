import { TrialsApplicationsManager } from "@/components/admin/TrialsApplicationsManager";
import { listTrialsApplications } from "@/lib/trials-applications";

export const metadata = { title: "Trials applications" };

export default async function CoachTrialsApplicationsPage() {
  const applications = await listTrialsApplications();

  return (
    <>
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
    </>
  );
}
