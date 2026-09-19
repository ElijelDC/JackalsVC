import { StudentIdReviewsManager } from "@/components/admin/StudentIdReviewsManager";
import { PageContainer } from "@/components/layout/PageShell";
import { requireAdminPage } from "@/lib/admin-auth";
import { listStudentIdReviewsForAdmin } from "@/lib/student-id-reviews";

export const metadata = { title: "Student/U18 ID reviews | Admin" };

export default async function AdminStudentIdReviewsPage() {
  await requireAdminPage();
  const reviews = await listStudentIdReviewsForAdmin();

  return (
    <PageContainer>
      <StudentIdReviewsManager initialReviews={reviews} />
    </PageContainer>
  );
}
