import { requireAdminPage } from "@/lib/admin-auth";
import { AdminNotificationsProvider } from "@/components/admin/AdminNotificationsProvider";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminActionQueue } from "@/lib/admin-action-queue";
import { adminPageMetadata } from "@/lib/seo";

export const metadata = adminPageMetadata("Admin");

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPage();
  const notifications = await getAdminActionQueue();

  return (
    <AdminNotificationsProvider initial={notifications}>
      <AdminShell>{children}</AdminShell>
    </AdminNotificationsProvider>
  );
}
