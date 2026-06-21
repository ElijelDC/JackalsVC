import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { galleryPhotoSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id: albumId } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    galleryPhotoSchema,
  );
  if (parseError || !data) return parseError!;

  const album = await prisma.galleryAlbum.findUnique({ where: { id: albumId } });
  if (!album) {
    return jsonError("Album not found", 404);
  }

  const photo = await prisma.galleryPhoto.create({
    data: {
      albumId,
      title: data.title ?? null,
      caption: data.caption ?? null,
      imageUrl: data.imageUrl,
      sortOrder: data.sortOrder,
    },
  });

  return NextResponse.json({ photo }, { status: 201 });
}
