import { GalleryShowcase } from "@/components/gallery/GalleryShowcase";
import { pageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";

export const metadata = pageMetadata({
  title: "Gallery",
  description:
    "Photos from Jackals Volleyball Club — match days, training, tournaments, and club events in Dublin.",
  path: "/gallery",
});

export const revalidate = 3600;

export default async function GalleryPage() {
  const albums = await prisma.galleryAlbum.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { photos: true } },
    },
  });

  return (
    <GalleryShowcase
      albums={albums.map((album) => ({
        id: album.id,
        title: album.title,
        description: album.description,
        coverImageUrl: album.coverImageUrl,
        category: album.category,
        photoCount: album._count.photos,
      }))}
    />
  );
}
