import { prisma } from "@/lib/prisma";

const HOMEPAGE_GALLERY_MIN = 2;
const HOMEPAGE_GALLERY_MAX = 3;

export async function getHomepageGalleryHighlights() {
  const featured = await prisma.galleryAlbum.findMany({
    where: { featured: true },
    take: HOMEPAGE_GALLERY_MAX,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      coverImageUrl: true,
    },
  });

  if (featured.length >= HOMEPAGE_GALLERY_MIN) {
    return featured;
  }

  const featuredIds = featured.map((album) => album.id);
  const fallback = await prisma.galleryAlbum.findMany({
    where: featuredIds.length > 0 ? { id: { notIn: featuredIds } } : {},
    take: HOMEPAGE_GALLERY_MAX - featured.length,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      coverImageUrl: true,
    },
  });

  return [...featured, ...fallback].slice(0, HOMEPAGE_GALLERY_MAX);
}
