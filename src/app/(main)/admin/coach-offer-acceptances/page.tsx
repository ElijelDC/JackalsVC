import { CoachOfferAcceptancesManager } from "@/components/admin/CoachOfferAcceptancesManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { serializeCoachOfferResponse } from "@/lib/coach-offer-response-config";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Coach offer responses | Admin" };

export default async function AdminCoachOfferAcceptancesPage() {
  const responses = await prisma.coachOfferAcceptance.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Coach offer responses"
        description="Acceptances and declines from Coach Offer pages. Filter by status or team — read-only."
      />
      <CoachOfferAcceptancesManager
        initialResponses={responses.map(serializeCoachOfferResponse)}
      />
    </PageContainer>
  );
}
