import { notFound, redirect } from "next/navigation";
import { ClubOfferExperience } from "@/components/club-offer/ClubOfferExperience";
import {
  CLUB_OFFER_LEGACY_TEAM_SLUG,
  CLUB_OFFER_TEAM_SLUGS,
  getClubOfferTeam,
} from "@/lib/club-offer-config";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return CLUB_OFFER_TEAM_SLUGS.map((team) => ({ team }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: teamSlug } = await params;
  const team = getClubOfferTeam(teamSlug);
  if (!team) return { title: "Club Offer" };

  return pageMetadata({
    title: `Club Offer — ${team.shortName}`,
    description: `You've received a Jackals Volleyball Club offer for ${team.fullName}. Review the benefits and confirm your place.`,
    path: `/club-offer/${team.slug}`,
    noIndex: true,
  });
}

export default async function ClubOfferPage({
  params,
}: {
  params: Promise<{ team: string }>;
}) {
  const { team: teamSlug } = await params;
  if (teamSlug === CLUB_OFFER_LEGACY_TEAM_SLUG) {
    redirect("/club-offer/division-3-men");
  }
  const team = getClubOfferTeam(teamSlug);
  if (!team) notFound();

  return <ClubOfferExperience team={team} />;
}
