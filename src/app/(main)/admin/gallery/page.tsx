import { prisma } from "@/lib/prisma";
import { GalleryAlbumManager } from "@/components/admin/GalleryAlbumManager";

export const metadata = {
  title: "Admin · Gallery",
};

export default async function AdminGalleryPage() {
  const albums = await prisma.galleryAlbum.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { photos: true } },
    },
  });

  return <GalleryAlbumManager initialAlbums={albums} />;
}
