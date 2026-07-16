import { notFound } from "next/navigation";
import { TournamentHubPage } from "@/components/tournaments/TournamentHubPage";
import {
  isReclubCompetitionId,
  reclubCompetitionUrl,
} from "@/lib/reclub-config";
import { pageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { getTournamentHubBySlug } from "@/lib/tournament-hub-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hub = getTournamentHubBySlug(slug);
  if (!hub) return { title: "Tournament" };

  return pageMetadata({
    title: hub.title,
    description: hub.subtitle,
    path: `/tournaments/${slug}`,
  });
}

export default async function TournamentHubRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hub = getTournamentHubBySlug(slug);
  if (!hub) notFound();

  const event = await prisma.event.findFirst({
    where: {
      OR: [
        { id: { in: hub.eventIds } },
        { reclubReferenceCode: { in: hub.reclubReferenceCodes } },
      ],
    },
    select: {
      id: true,
      rulesPdfUrl: true,
    },
    orderBy: { startDate: "desc" },
  });

  const rulesPdfUrl = event?.rulesPdfUrl ?? hub.defaultRulesPdfUrl ?? null;
  const competitionId =
    hub.reclubReferenceCodes.find((code) => isReclubCompetitionId(code)) ??
    null;
  const standingsUrl = competitionId
    ? reclubCompetitionUrl(competitionId)
    : null;

  return (
    <TournamentHubPage
      hub={hub}
      eventId={event?.id ?? hub.eventIds[0] ?? null}
      rulesPdfUrl={rulesPdfUrl}
      standingsUrl={standingsUrl}
    />
  );
}
