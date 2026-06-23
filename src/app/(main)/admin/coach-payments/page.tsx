import { AdminCoachPaymentsManager } from "@/components/admin/AdminCoachPaymentsManager";
import { getAdminCoachPaymentRows } from "@/lib/admin-coach-payments";
import { COACH_SESSION_RATE_EUR } from "@/lib/coach-payments-config";

export const metadata = {
  title: "Admin · Coach payments",
};

export default async function AdminCoachPaymentsPage() {
  const coaches = await getAdminCoachPaymentRows({
    monthsBack: 12,
    monthsAhead: 6,
  });

  return (
    <AdminCoachPaymentsManager
      initialCoaches={coaches}
      ratePerSession={COACH_SESSION_RATE_EUR}
    />
  );
}
