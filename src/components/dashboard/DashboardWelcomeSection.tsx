import { AddToHomescreenButton } from "@/components/dashboard/AddToHomescreenButton";
import { PageHeader } from "@/components/layout/PageShell";

export function DashboardWelcomeSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <PageHeader title={title} description={description} className="mb-0 min-w-0 flex-1" />
      <div className="shrink-0 sm:pt-1">
        <AddToHomescreenButton className="w-full sm:w-auto" />
      </div>
    </div>
  );
}
