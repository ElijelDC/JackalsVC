import { ClubOfferAcceptancesManager } from "@/components/admin/ClubOfferAcceptancesManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { serializeClubOfferResponse } from "@/lib/club-offer-response-config";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Club offer responses | Admin" };

export default async function AdminClubOfferAcceptancesPage() {
  const responses = await prisma.clubOfferAcceptance.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Club offer responses"
        description="Acceptances and declines from Club Offer pages. Filter by status or team — read-only."
      />
      <ClubOfferAcceptancesManager
        initialResponses={responses.map(serializeClubOfferResponse)}
      />
    </PageContainer>
  );
}
