import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { galleryAlbumSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  const album = await prisma.galleryAlbum.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!album) {
    return jsonError("Album not found", 404);
  }

  return NextResponse.json({ album });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    galleryAlbumSchema,
  );
  if (parseError || !data) return parseError!;

  try {
    const album = await prisma.galleryAlbum.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description ?? null,
        coverImageUrl: data.coverImageUrl,
        category: data.category,
        featured: data.featured,
        sortOrder: data.sortOrder,
        tournamentSlug: data.tournamentSlug ?? null,
      },
    });
    return NextResponse.json({ album });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return jsonError(
        "That tournament already has a linked gallery album.",
        409,
      );
    }
    return jsonError("Album not found", 404);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.galleryAlbum.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Album not found", 404);
  }
}
