import { NextResponse } from "next/server";
import { parseJsonBody, requireAdmin } from "@/lib/api";
import { GALLERY_PLACEHOLDER_COVER } from "@/lib/gallery-config";
import { prisma } from "@/lib/prisma";
import { galleryAlbumSchema } from "@/lib/validations";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const albums = await prisma.galleryAlbum.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { photos: true } },
    },
  });
  return NextResponse.json({ albums });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    galleryAlbumSchema,
  );
  if (parseError || !data) return parseError!;

  const album = await prisma.galleryAlbum.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      coverImageUrl: data.coverImageUrl ?? GALLERY_PLACEHOLDER_COVER,
      category: data.category,
      featured: data.featured,
      sortOrder: data.sortOrder,
      tournamentSlug: data.tournamentSlug ?? null,
    },
  });
  return NextResponse.json({ album }, { status: 201 });
}
