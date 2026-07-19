import { OurTournamentsShowcase } from "@/components/tournaments/OurTournamentsShowcase";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";
import { getCompletedTournaments } from "@/lib/tournament-archive";

export const metadata = pageMetadata({
  title: "Our Tournaments",
  description:
    "Tournaments hosted by Jackals Volleyball Club — champions, pool standings, and play-off results.",
  path: "/tournaments",
});

export default async function OurTournamentsPage() {
  const tournaments = getCompletedTournaments();
  const covers = await prisma.tournamentCover.findMany({
    where: {
      tournamentSlug: { in: tournaments.map((t) => t.slug) },
    },
    select: { tournamentSlug: true, imageUrl: true },
  });
  const coverBySlug = new Map(
    covers.map((cover) => [cover.tournamentSlug, cover.imageUrl]),
  );

  const withCovers = tournaments.map((entry) => {
    const customCover = coverBySlug.get(entry.slug);
    return customCover ? { ...entry, coverImage: customCover } : entry;
  });

  return <OurTournamentsShowcase tournaments={withCovers} />;
}
