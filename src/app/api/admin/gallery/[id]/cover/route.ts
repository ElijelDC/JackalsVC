import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { saveGalleryImageFile } from "@/lib/gallery-upload";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id: albumId } = await params;

  const album = await prisma.galleryAlbum.findUnique({ where: { id: albumId } });
  if (!album) {
    return jsonError("Album not found", 404);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose a cover image to upload.", 400);
  }

  try {
    const coverImageUrl = await saveGalleryImageFile(file, albumId);
    const updated = await prisma.galleryAlbum.update({
      where: { id: albumId },
      data: { coverImageUrl },
    });
    return NextResponse.json({ album: updated, coverImageUrl });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Cover upload failed.",
      400,
    );
  }
}
