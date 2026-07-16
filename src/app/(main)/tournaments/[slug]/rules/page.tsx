import { notFound } from "next/navigation";
import { TournamentRulesPreview } from "@/components/tournaments/TournamentRulesPreview";
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
  if (!hub) return { title: "Tournament rules" };

  return pageMetadata({
    title: `${hub.title} — Rules`,
    description: "Preview the tournament rules document.",
    path: `/tournaments/${slug}/rules`,
    noIndex: true,
  });
}

export default async function TournamentRulesPreviewPage({
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
    select: { rulesPdfUrl: true },
    orderBy: { startDate: "desc" },
  });

  const rulesPdfUrl = event?.rulesPdfUrl ?? hub.defaultRulesPdfUrl ?? null;
  if (!rulesPdfUrl) notFound();

  return (
    <TournamentRulesPreview
      title={hub.title}
      rulesPdfUrl={rulesPdfUrl}
      backHref={`/tournaments/${slug}`}
    />
  );
}
