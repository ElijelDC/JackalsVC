import { notFound } from "next/navigation";
import { TournamentHubPage } from "@/components/tournaments/TournamentHubPage";
import {
  isReclubCompetitionId,
  reclubCompetitionUrl,
} from "@/lib/reclub-config";
import { pageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { getTournamentArchiveBySlug } from "@/lib/tournament-archive";
import { getTournamentHubBySlug } from "@/lib/tournament-hub-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hub = getTournamentHubBySlug(slug);
  const archive = getTournamentArchiveBySlug(slug);
  if (!hub) return { title: "Tournament" };

  const description =
    archive?.status === "completed"
      ? `${archive.blurb} Champions: ${archive.podium.find((p) => p.place === 1)?.team ?? "TBC"}.`
      : hub.subtitle;

  return pageMetadata({
    title: hub.title,
    description,
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

  const archive = getTournamentArchiveBySlug(slug);

  const [event, winnerPhotoRows, galleryAlbumRow] = await Promise.all([
    prisma.event.findFirst({
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
    }),
    prisma.tournamentWinnerPhoto.findMany({
      where: { tournamentSlug: slug },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.galleryAlbum.findUnique({
      where: { tournamentSlug: slug },
      select: {
        id: true,
        title: true,
        description: true,
        coverImageUrl: true,
        category: true,
        _count: { select: { photos: true } },
      },
    }),
  ]);

  const rulesPdfUrl = event?.rulesPdfUrl ?? hub.defaultRulesPdfUrl ?? null;
  const competitionId =
    hub.reclubReferenceCodes.find((code) => isReclubCompetitionId(code)) ??
    null;
  const standingsUrl = competitionId
    ? reclubCompetitionUrl(competitionId)
    : null;

  const archiveWithPhotos =
    archive == null
      ? null
      : {
          ...archive,
          winnerPhotos:
            winnerPhotoRows.length > 0
              ? winnerPhotoRows.map((photo) => ({
                  src: photo.imageUrl,
                  alt: photo.alt?.trim() || `${archive.title} winners`,
                }))
              : archive.winnerPhotos,
        };

  const galleryAlbum = galleryAlbumRow
    ? {
        id: galleryAlbumRow.id,
        title: galleryAlbumRow.title,
        description: galleryAlbumRow.description,
        coverImageUrl: galleryAlbumRow.coverImageUrl,
        category: galleryAlbumRow.category,
        photoCount: galleryAlbumRow._count.photos,
      }
    : null;

  return (
    <TournamentHubPage
      hub={hub}
      archive={archiveWithPhotos}
      galleryAlbum={galleryAlbum}
      eventId={event?.id ?? hub.eventIds[0] ?? null}
      rulesPdfUrl={rulesPdfUrl}
      standingsUrl={standingsUrl}
    />
  );
}
