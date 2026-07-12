import { notFound } from "next/navigation";
import { GalleryAlbumDetailView } from "@/components/gallery/GalleryAlbumDetailView";
import { getPublicGalleryAlbumById } from "@/lib/public-page-data";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await getPublicGalleryAlbumById(id);
  if (!album) {
    return pageMetadata({ title: "Gallery Album", path: `/gallery/${id}` });
  }

  return pageMetadata({
    title: album.title,
    description:
      album.description ??
      `${album.title} — photo album from Jackals Volleyball Club, Dublin.`,
    path: `/gallery/${id}`,
  });
}

export default async function GalleryAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const album = await getPublicGalleryAlbumById(id);

  if (!album) {
    notFound();
  }

  return <GalleryAlbumDetailView album={album} />;
}
