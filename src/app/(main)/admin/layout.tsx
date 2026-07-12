import { requireAdminPage } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminActionQueue } from "@/lib/admin-action-queue";
import { pageMetadata, adminPageMetadata } from "@/lib/seo";

export const metadata = adminPageMetadata("Admin");

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  const { badgeCounts } = await getAdminActionQueue();

  return <AdminShell badgeCounts={badgeCounts}>{children}</AdminShell>;
}
