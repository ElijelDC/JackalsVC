import { NextResponse } from "next/server";
import { parseJsonBody, requireAdmin } from "@/lib/api";
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
      coverImageUrl: data.coverImageUrl,
      category: data.category,
      featured: data.featured,
      sortOrder: data.sortOrder,
    },
  });
  return NextResponse.json({ album }, { status: 201 });
}
