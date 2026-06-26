"use client";

import { Images, Layers } from "lucide-react";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { ShowcaseHero } from "@/components/layout/ShowcaseHero";
import type { GalleryAlbumItem } from "@/components/gallery/GalleryAlbumCard";

export function GalleryShowcase({ albums }: { albums: GalleryAlbumItem[] }) {
  const totalPhotos = albums.reduce((sum, album) => sum + album.photoCount, 0);

  return (
    <>
      <ShowcaseHero
        title="Club"
        highlight="Gallery"
        description="Browse photo albums from matches, training, socials, and club events — tap an album to see more inside."
        stats={
          albums.length > 0
            ? [
                {
                  icon: Layers,
                  value: albums.length,
                  label: albums.length === 1 ? "album" : "albums",
                },
                ...(totalPhotos > 0
                  ? [
                      {
                        icon: Images,
                        value: totalPhotos,
                        label: totalPhotos === 1 ? "photo" : "photos",
                      },
                    ]
                  : []),
              ]
            : undefined
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <GalleryGrid albums={albums} />
      </div>
    </>
  );
}
