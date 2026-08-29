import { RegistrationReviewsManager } from "@/components/admin/RegistrationReviewsManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Registration review | Admin" };

export default async function AdminRegistrationReviewsPage() {
  const reviews = await prisma.clubMember.findMany({
    where: {
      userId: null,
      active: true,
      registrationReviewStatus: "PENDING",
      vlyMembershipPhotoUrl: { startsWith: "/" },
    },
    orderBy: { registrationPhotoSubmittedAt: "asc" },
    select: {
      id: true,
      vlyNumber: true,
      name: true,
      vlyMembershipPhotoUrl: true,
      registrationPhotoSubmittedAt: true,
      rosterRole: true,
      trainingTeamKey: true,
    },
  });

  const items = reviews.map((review) => ({
    ...review,
    vlyNumber: review.vlyNumber,
    vlyMembershipPhotoUrl: review.vlyMembershipPhotoUrl!,
    registrationPhotoSubmittedAt:
      review.registrationPhotoSubmittedAt?.toISOString() ?? null,
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Registration review"
        description="Approve VLY membership screenshots before new members can finish creating their account."
      />
      <RegistrationReviewsManager initialReviews={items} />
    </PageContainer>
  );
}
