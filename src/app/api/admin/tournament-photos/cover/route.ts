import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getTournamentArchiveBySlug } from "@/lib/tournament-archive";
import { getTournamentHubBySlug } from "@/lib/tournament-hub-config";
import {
  deleteTournamentWinnerImageFile,
  saveTournamentWinnerImageFile,
  validateTournamentWinnerImageFile,
} from "@/lib/tournament-winner-image";

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const slug = new URL(request.url).searchParams.get("tournamentSlug")?.trim();
  if (!slug) return jsonError("Tournament slug is required.", 400);

  const cover = await prisma.tournamentCover.findUnique({
    where: { tournamentSlug: slug },
  });

  return NextResponse.json({ cover });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");
  const slug =
    typeof formData.get("tournamentSlug") === "string"
      ? String(formData.get("tournamentSlug")).trim()
      : "";

  if (!slug) return jsonError("Choose a tournament.", 400);
  if (!getTournamentHubBySlug(slug) && !getTournamentArchiveBySlug(slug)) {
    return jsonError("Unknown tournament slug.", 400);
  }
  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose an image to upload.", 400);
  }

  const fileError = validateTournamentWinnerImageFile(file);
  if (fileError) return jsonError(fileError, 400);

  try {
    const existing = await prisma.tournamentCover.findUnique({
      where: { tournamentSlug: slug },
    });

    const imageUrl = await saveTournamentWinnerImageFile(file, slug, "cover");

    const cover = await prisma.tournamentCover.upsert({
      where: { tournamentSlug: slug },
      create: { tournamentSlug: slug, imageUrl },
      update: { imageUrl },
    });

    if (existing?.imageUrl && existing.imageUrl !== imageUrl) {
      await deleteTournamentWinnerImageFile(existing.imageUrl);
    }

    return NextResponse.json({ cover });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Cover upload failed.",
      400,
    );
  }
}

export async function DELETE(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const slug = new URL(request.url).searchParams.get("tournamentSlug")?.trim();
  if (!slug) return jsonError("Tournament slug is required.", 400);

  const existing = await prisma.tournamentCover.findUnique({
    where: { tournamentSlug: slug },
  });
  if (!existing) return jsonError("No cover to remove.", 404);

  await deleteTournamentWinnerImageFile(existing.imageUrl);
  await prisma.tournamentCover.delete({ where: { tournamentSlug: slug } });

  return NextResponse.json({ success: true });
}
