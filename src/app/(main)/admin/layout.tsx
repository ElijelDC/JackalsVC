import { requireAdminPage } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminActionQueue } from "@/lib/admin-action-queue";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  const { badgeCounts } = await getAdminActionQueue();

  return <AdminShell badgeCounts={badgeCounts}>{children}</AdminShell>;
}
