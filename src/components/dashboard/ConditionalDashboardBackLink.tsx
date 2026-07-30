import { DashboardBackLink } from "@/components/dashboard/DashboardBackLink";
import { isDashboardReturn } from "@/lib/dashboard-return";

export function ConditionalDashboardBackLink({
  from,
  className,
}: {
  from: string | null | undefined;
  className?: string;
}) {
  if (!isDashboardReturn(from)) return null;

  return (
    <DashboardBackLink href="/dashboard" label="Dashboard" className={className} />
  );
}
