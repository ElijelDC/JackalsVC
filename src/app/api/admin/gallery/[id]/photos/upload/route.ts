import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import {
  GALLERY_MAX_BULK_FILES,
  saveGalleryImageFile,
} from "@/lib/gallery-upload";
import { isGalleryPlaceholderCover } from "@/lib/gallery-config";
import { prisma } from "@/lib/prisma";

export const maxDuration = 120;

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

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return jsonError(
      "Upload was too large for the server to read. Try fewer photos at once, or wait a moment and try again.",
      413,
    );
  }
  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return jsonError("Choose at least one image to upload.", 400);
  }

  if (files.length > GALLERY_MAX_BULK_FILES) {
    return jsonError(
      `You can upload up to ${GALLERY_MAX_BULK_FILES} images at once.`,
      400,
    );
  }

  const maxSort = await prisma.galleryPhoto.aggregate({
    where: { albumId },
    _max: { sortOrder: true },
  });
  let nextSort = (maxSort._max.sortOrder ?? -1) + 1;

  const photos = [];
  const errors: string[] = [];

  for (const file of files) {
    try {
      const imageUrl = await saveGalleryImageFile(file, albumId);
      const photo = await prisma.galleryPhoto.create({
        data: {
          albumId,
          imageUrl,
          title: null,
          sortOrder: nextSort,
        },
      });
      photos.push(photo);
      nextSort += 1;
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : `Failed to upload ${file.name}`,
      );
    }
  }

  if (photos.length === 0) {
    return jsonError(errors[0] ?? "Upload failed.", 400);
  }

  if (isGalleryPlaceholderCover(album.coverImageUrl)) {
    await prisma.galleryAlbum.update({
      where: { id: albumId },
      data: { coverImageUrl: photos[0]!.imageUrl },
    });
  }

  const updatedAlbum = await prisma.galleryAlbum.findUnique({
    where: { id: albumId },
    select: { coverImageUrl: true },
  });

  return NextResponse.json({
    photos,
    uploaded: photos.length,
    errors,
    coverImageUrl: updatedAlbum?.coverImageUrl,
  });
}
