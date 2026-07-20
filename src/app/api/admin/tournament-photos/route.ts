import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getTournamentArchiveBySlug } from "@/lib/tournament-archive";
import { getTournamentHubBySlug } from "@/lib/tournament-hub-config";
import { deleteTournamentWinnerImageFile } from "@/lib/tournament-winner-image";
import {
  defaultAltForWinnerPhoto,
  isTournamentWinnerPhotoKind,
  TOURNAMENT_WINNER_PHOTO_KINDS,
} from "@/lib/tournament-winner-photo";

const createSchema = z.object({
  tournamentSlug: z.string().min(1),
  kind: z.enum(TOURNAMENT_WINNER_PHOTO_KINDS),
  imageUrl: z.string().min(1),
  alt: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(TOURNAMENT_WINNER_PHOTO_KINDS).optional(),
  alt: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("tournamentSlug")?.trim();

  const photos = await prisma.tournamentWinnerPhoto.findMany({
    where: slug ? { tournamentSlug: slug } : undefined,
    orderBy: [
      { tournamentSlug: "asc" },
      { sortOrder: "asc" },
      { createdAt: "asc" },
    ],
  });

  return NextResponse.json({ photos });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    createSchema,
  );
  if (parseError || !data) return parseError!;

  if (
    !getTournamentHubBySlug(data.tournamentSlug) &&
    !getTournamentArchiveBySlug(data.tournamentSlug)
  ) {
    return jsonError("Unknown tournament slug.", 400);
  }

  if (!isTournamentWinnerPhotoKind(data.kind)) {
    return jsonError("Invalid photo kind.", 400);
  }

  const title =
    getTournamentArchiveBySlug(data.tournamentSlug)?.title ??
    getTournamentHubBySlug(data.tournamentSlug)?.title ??
    data.tournamentSlug;

  const maxOrder = await prisma.tournamentWinnerPhoto.aggregate({
    where: { tournamentSlug: data.tournamentSlug },
    _max: { sortOrder: true },
  });

  const photo = await prisma.tournamentWinnerPhoto.create({
    data: {
      tournamentSlug: data.tournamentSlug,
      kind: data.kind,
      imageUrl: data.imageUrl,
      alt: data.alt?.trim() || defaultAltForWinnerPhoto(data.kind, title),
      sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json({ photo }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    updateSchema,
  );
  if (parseError || !data) return parseError!;

  const existing = await prisma.tournamentWinnerPhoto.findUnique({
    where: { id: data.id },
  });
  if (!existing) return jsonError("Photo not found.", 404);

  const nextKind = data.kind ?? existing.kind;
  if (!isTournamentWinnerPhotoKind(nextKind)) {
    return jsonError("Invalid photo kind.", 400);
  }

  const title =
    getTournamentArchiveBySlug(existing.tournamentSlug)?.title ??
    getTournamentHubBySlug(existing.tournamentSlug)?.title ??
    existing.tournamentSlug;

  let nextAlt = existing.alt;
  if (data.alt !== undefined) {
    const trimmed = data.alt?.trim() ?? "";
    nextAlt = trimmed || defaultAltForWinnerPhoto(nextKind, title);
  }

  const photo = await prisma.tournamentWinnerPhoto.update({
    where: { id: data.id },
    data: {
      kind: nextKind,
      alt: nextAlt,
    },
  });

  return NextResponse.json({ photo });
}

export async function DELETE(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) return jsonError("Photo id is required.", 400);

  const existing = await prisma.tournamentWinnerPhoto.findUnique({
    where: { id },
  });
  if (!existing) return jsonError("Photo not found.", 404);

  await deleteTournamentWinnerImageFile(existing.imageUrl);
  await prisma.tournamentWinnerPhoto.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
