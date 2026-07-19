import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { GALLERY_PLACEHOLDER_COVER } from "@/lib/gallery-config";
import { prisma } from "@/lib/prisma";
import { getTournamentArchiveBySlug } from "@/lib/tournament-archive";
import { getTournamentHubBySlug } from "@/lib/tournament-hub-config";

const createSchema = z.object({
  tournamentSlug: z.string().min(1),
});

const linkSchema = z.object({
  tournamentSlug: z.string().min(1),
  albumId: z.string().min(1).nullable(),
});

function resolveTournament(slug: string) {
  const hub = getTournamentHubBySlug(slug);
  const archive = getTournamentArchiveBySlug(slug);
  if (!hub && !archive) return null;
  return { hub, archive };
}

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const slug = new URL(request.url).searchParams.get("tournamentSlug")?.trim();
  if (!slug) return jsonError("Tournament slug is required.", 400);

  const album = await prisma.galleryAlbum.findUnique({
    where: { tournamentSlug: slug },
    include: { _count: { select: { photos: true } } },
  });

  return NextResponse.json({ album });
}

/** Create a gallery album for a tournament, or return the existing linked one. */
export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    createSchema,
  );
  if (parseError || !data) return parseError!;

  const slug = data.tournamentSlug.trim();
  const resolved = resolveTournament(slug);
  if (!resolved) {
    return jsonError("Unknown tournament slug.", 400);
  }

  const existing = await prisma.galleryAlbum.findUnique({
    where: { tournamentSlug: slug },
    include: { _count: { select: { photos: true } } },
  });
  if (existing) {
    return NextResponse.json({ album: existing, created: false });
  }

  const title =
    resolved.archive?.title ?? resolved.hub?.title ?? slug;
  const description =
    resolved.archive != null
      ? `${resolved.archive.dateLabel} · ${resolved.archive.location}`
      : resolved.hub
        ? `${resolved.hub.dateLabel} · ${resolved.hub.location}`
        : null;

  const maxOrder = await prisma.galleryAlbum.aggregate({
    _max: { sortOrder: true },
  });

  const album = await prisma.galleryAlbum.create({
    data: {
      title,
      description,
      coverImageUrl: GALLERY_PLACEHOLDER_COVER,
      category: "TOURNAMENT",
      featured: false,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      tournamentSlug: slug,
    },
    include: { _count: { select: { photos: true } } },
  });

  return NextResponse.json({ album, created: true }, { status: 201 });
}

/** Link an existing gallery album to a tournament, or unlink (albumId: null). */
export async function PATCH(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(request, linkSchema);
  if (parseError || !data) return parseError!;

  const slug = data.tournamentSlug.trim();
  if (!resolveTournament(slug)) {
    return jsonError("Unknown tournament slug.", 400);
  }

  if (data.albumId == null) {
    await prisma.galleryAlbum.updateMany({
      where: { tournamentSlug: slug },
      data: { tournamentSlug: null },
    });
    return NextResponse.json({ album: null });
  }

  const target = await prisma.galleryAlbum.findUnique({
    where: { id: data.albumId },
    include: { _count: { select: { photos: true } } },
  });
  if (!target) return jsonError("Album not found.", 404);

  if (target.tournamentSlug && target.tournamentSlug !== slug) {
    return jsonError(
      "That album is already linked to another tournament. Unlink it first.",
      400,
    );
  }

  await prisma.$transaction([
    prisma.galleryAlbum.updateMany({
      where: {
        tournamentSlug: slug,
        id: { not: target.id },
      },
      data: { tournamentSlug: null },
    }),
    prisma.galleryAlbum.update({
      where: { id: target.id },
      data: {
        tournamentSlug: slug,
        category:
          target.category === "TOURNAMENT" ? target.category : "TOURNAMENT",
      },
    }),
  ]);

  const album = await prisma.galleryAlbum.findUnique({
    where: { id: target.id },
    include: { _count: { select: { photos: true } } },
  });

  return NextResponse.json({ album });
}
