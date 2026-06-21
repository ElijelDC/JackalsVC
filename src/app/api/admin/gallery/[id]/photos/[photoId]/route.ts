import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { galleryPhotoSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { photoId } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    galleryPhotoSchema,
  );
  if (parseError || !data) return parseError!;

  try {
    const photo = await prisma.galleryPhoto.update({
      where: { id: photoId },
      data: {
        title: data.title ?? null,
        caption: data.caption ?? null,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder,
      },
    });
    return NextResponse.json({ photo });
  } catch {
    return jsonError("Photo not found", 404);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { photoId } = await params;

  try {
    await prisma.galleryPhoto.delete({ where: { id: photoId } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Photo not found", 404);
  }
}
