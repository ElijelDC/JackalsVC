import { notFound, redirect } from "next/navigation";
import { CoachOfferExperience } from "@/components/coach-offer/CoachOfferExperience";
import {
  COACH_OFFER_LEGACY_TEAM_SLUG,
  COACH_OFFER_TEAM_SLUGS,
  getCoachOfferTeam,
} from "@/lib/coach-offer-config";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return COACH_OFFER_TEAM_SLUGS.map((team) => ({ team }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: teamSlug } = await params;
  const team = getCoachOfferTeam(teamSlug);
  if (!team) return { title: "Coach Offer" };

  return pageMetadata({
    title: `Coach Offer — ${team.shortName}`,
    description: `You've received a Jackals Volleyball Club coaching offer for ${team.fullName}. Review the benefits and confirm your role.`,
    path: `/coach-offer/${team.slug}`,
    noIndex: true,
  });
}

export default async function CoachOfferPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: teamSlug } = await params;
  if (teamSlug === COACH_OFFER_LEGACY_TEAM_SLUG) {
    redirect("/coach-offer/division-3-men");
  }
  const team = getCoachOfferTeam(teamSlug);
  if (!team) notFound();

  return <CoachOfferExperience team={team} />;
}
