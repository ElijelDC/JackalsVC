import { notFound } from "next/navigation";
import { GalleryAlbumDetailView } from "@/components/gallery/GalleryAlbumDetailView";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await prisma.galleryAlbum.findUnique({ where: { id } });
  return { title: album?.title ?? "Gallery album" };
}

export default async function GalleryAlbumPage({
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

  return <GalleryAlbumDetailView album={album} />;
}
