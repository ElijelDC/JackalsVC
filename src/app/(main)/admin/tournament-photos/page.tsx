import { Suspense } from "react";
import { TournamentWinnerPhotosManager } from "@/components/admin/TournamentWinnerPhotosManager";
import { prisma } from "@/lib/prisma";
import { TOURNAMENT_ARCHIVE } from "@/lib/tournament-archive";
import { TOURNAMENT_HUBS } from "@/lib/tournament-hub-config";

export const metadata = {
  title: "Admin · Tournament photos",
};

async function TournamentPhotosAdmin() {
  const bySlug = new Map<string, string>();
  for (const hub of TOURNAMENT_HUBS) {
    bySlug.set(hub.slug, hub.title);
  }
  for (const entry of TOURNAMENT_ARCHIVE) {
    bySlug.set(entry.slug, entry.title);
  }

  const tournaments = [...bySlug.entries()].map(([slug, title]) => ({
    slug,
    title,
  }));
  const slugs = tournaments.map((t) => t.slug);

  const [photos, albums, covers] = await Promise.all([
    prisma.tournamentWinnerPhoto.findMany({
      orderBy: [
        { tournamentSlug: "asc" },
        { sortOrder: "asc" },
        { createdAt: "asc" },
      ],
    }),
    prisma.galleryAlbum.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        tournamentSlug: true,
        _count: { select: { photos: true } },
      },
    }),
    prisma.tournamentCover.findMany({
      where: { tournamentSlug: { in: slugs } },
      select: { tournamentSlug: true, imageUrl: true },
    }),
  ]);

  return (
    <TournamentWinnerPhotosManager
      tournaments={tournaments}
      initialPhotos={photos}
      initialAlbums={albums}
      initialCovers={covers}
    />
  );
}

export default function AdminTournamentPhotosPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/60">Loading…</p>}>
      <TournamentPhotosAdmin />
    </Suspense>
  );
}
