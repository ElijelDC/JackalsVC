import "server-only";

import { GALLERY_MAX_UPLOAD_BYTES } from "@/lib/gallery-upload-config";
import { validateImageFile } from "@/lib/image-upload-types";
import {
  deleteManagedUploadFile,
  randomUploadFilename,
  saveManagedImageFile,
} from "@/lib/save-upload.server";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export {
  TOURNAMENT_WINNER_PHOTO_KINDS,
  TOURNAMENT_WINNER_KIND_LABELS,
  defaultAltForWinnerPhoto,
  isTournamentWinnerPhotoKind,
  type TournamentWinnerPhotoKind,
} from "@/lib/tournament-winner-photo";

export function validateTournamentWinnerImageFile(file: File): string | null {
  return validateImageFile(file, {
    maxBytes: GALLERY_MAX_UPLOAD_BYTES,
    sizeError: "Image must be smaller than 15 MB.",
  });
}

export async function saveTournamentWinnerImageFile(
  file: File,
  tournamentSlug: string,
  subfolder?: string,
): Promise<string> {
  const safeSlug = tournamentSlug.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeSlug) {
    throw new Error("Invalid tournament slug.");
  }
  const safeSub =
    subfolder?.replace(/[^a-zA-Z0-9_-]/g, "") || undefined;
  const relativeDir = safeSub
    ? ["tournament-winners", safeSlug, safeSub]
    : ["tournament-winners", safeSlug];
  const urlPrefix = safeSub
    ? `${PUBLIC_PATHS.uploads.tournamentWinners}/${safeSlug}/${safeSub}`
    : `${PUBLIC_PATHS.uploads.tournamentWinners}/${safeSlug}`;

  return saveManagedImageFile({
    file,
    preset: "gallery",
    relativeDir,
    urlPrefix,
    maxBytes: GALLERY_MAX_UPLOAD_BYTES,
    sizeError: "exceeds the 15 MB limit.",
    buildFilename: (extension) => randomUploadFilename(extension),
  });
}

export async function deleteTournamentWinnerImageFile(
  imageUrl: string | null | undefined,
) {
  if (!imageUrl) return;
  await deleteManagedUploadFile(
    imageUrl,
    PUBLIC_PATHS.uploads.tournamentWinners,
  );
}
