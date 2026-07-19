import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { getTournamentArchiveBySlug } from "@/lib/tournament-archive";
import { getTournamentHubBySlug } from "@/lib/tournament-hub-config";
import {
  saveTournamentWinnerImageFile,
  validateTournamentWinnerImageFile,
} from "@/lib/tournament-winner-image";

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");
  const slug =
    typeof formData.get("tournamentSlug") === "string"
      ? String(formData.get("tournamentSlug")).trim()
      : "";

  if (!slug) {
    return jsonError("Choose a tournament.", 400);
  }

  if (!getTournamentHubBySlug(slug) && !getTournamentArchiveBySlug(slug)) {
    return jsonError("Unknown tournament slug.", 400);
  }

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose an image to upload.", 400);
  }

  const fileError = validateTournamentWinnerImageFile(file);
  if (fileError) return jsonError(fileError, 400);

  try {
    const imageUrl = await saveTournamentWinnerImageFile(file, slug);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Image upload failed.",
      400,
    );
  }
}
