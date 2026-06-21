import { GalleryShowcase } from "@/components/gallery/GalleryShowcase";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Gallery",
};

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
