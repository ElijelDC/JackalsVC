import { TrainingPaygAdminManager } from "@/components/admin/TrainingPaygAdminManager";
import { PageContainer } from "@/components/layout/PageShell";
import { listTrainingPaygAttendancesForAdmin } from "@/lib/training-payg";
import { getTrainingPaygSettings } from "@/lib/training-payg-settings";

export const metadata = { title: "Pay Per Training | Admin" };

export default async function AdminTrainingPaygPage() {
  const [settings, attendances] = await Promise.all([
    getTrainingPaygSettings(),
    listTrainingPaygAttendancesForAdmin(),
  ]);

  return (
    <PageContainer>
      <TrainingPaygAdminManager
        initialSettings={settings}
        initialAttendances={attendances}
      />
    </PageContainer>
  );
}
