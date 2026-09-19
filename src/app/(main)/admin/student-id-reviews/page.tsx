import { StudentIdReviewsManager } from "@/components/admin/StudentIdReviewsManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { requireAdminPage } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Student/U18 ID reviews | Admin" };

export default async function AdminStudentIdReviewsPage() {
  await requireAdminPage();

  const reviews = await prisma.membership.findMany({
    where: {
      studentIdReviewStatus: "PENDING",
      studentIdProofUrl: { startsWith: "/" },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      plan: { select: { name: true } },
    },
    orderBy: { studentIdProofSubmittedAt: "asc" },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Student / U18 ID reviews"
        description="Approve student or under-18 ID photos before confirming the discounted rate."
      />
      <StudentIdReviewsManager
        initialReviews={reviews.map((row) => ({
          id: row.id,
          planName: row.plan.name,
          studentIdProofUrl: row.studentIdProofUrl!,
          studentIdProofSubmittedAt:
            row.studentIdProofSubmittedAt?.toISOString() ?? null,
          studentIdReviewStatus: row.studentIdReviewStatus,
          user: row.user,
        }))}
      />
    </PageContainer>
  );
}
