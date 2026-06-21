import { notFound } from "next/navigation";
import { GalleryAlbumEditor } from "@/components/admin/GalleryAlbumEditor";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await prisma.galleryAlbum.findUnique({ where: { id } });
  return { title: album ? `Admin · ${album.title}` : "Admin · Gallery album" };
}

export default async function AdminGalleryAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    notFound();
  }

  return <GalleryAlbumEditor initialAlbum={album} />;
}
