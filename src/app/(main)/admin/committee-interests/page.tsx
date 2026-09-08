import { CommitteeInterestsManager } from "@/components/admin/CommitteeInterestsManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { serializeCommitteeInterest } from "@/lib/committee-roles-config";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Committee interests | Admin" };

export default async function AdminCommitteeInterestsPage() {
  const interests = await prisma.committeeInterest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Committee interests"
        description="Ranked role preferences from members for the 2026/27 committee."
      />
      <CommitteeInterestsManager
        initialInterests={interests.map(serializeCommitteeInterest)}
      />
    </PageContainer>
  );
}
