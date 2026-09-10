import { PageHeader } from "@/components/layout/PageShell";

export function DashboardWelcomeSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 sm:mb-8">
      <PageHeader title={title} description={description} className="mb-0" />
    </div>
  );
}
