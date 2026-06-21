"use client";

import { Camera, Images, Layers } from "lucide-react";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import type { GalleryAlbumItem } from "@/components/gallery/GalleryAlbumCard";

const GALLERY_CATEGORIES = ["MATCH", "TRAINING", "SOCIAL", "EVENT"] as const;

export function GalleryShowcase({ albums }: { albums: GalleryAlbumItem[] }) {
  const totalPhotos = albums.reduce((sum, album) => sum + album.photoCount, 0);
  const categoryCount = GALLERY_CATEGORIES.filter((category) =>
    albums.some((album) => album.category === category),
  ).length;

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-background hero-bg">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(232,34,42,0.18),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 home-hero-grid opacity-30"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <AnimateIn immediate className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-4xl font-bold tracking-wide text-white sm:text-5xl lg:text-6xl">
              Club{" "}
              <span className="bg-gradient-to-r from-jackals-red-light to-jackals-red bg-clip-text text-transparent">
                Gallery
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
              Browse photo albums from matches, training, socials, and club
              events — tap an album to see more inside.
            </p>

            {albums.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-jackals-red-light" />
                  <span>
                    <span className="font-display text-2xl font-bold text-white">
                      {albums.length}
                    </span>{" "}
                    {albums.length === 1 ? "album" : "albums"}
                  </span>
                </div>
                {totalPhotos > 0 && (
                  <div className="flex items-center gap-2">
                    <Images className="h-5 w-5 text-jackals-red-light" />
                    <span>
                      <span className="font-display text-2xl font-bold text-white">
                        {totalPhotos}
                      </span>{" "}
                      {totalPhotos === 1 ? "photo" : "photos"}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-jackals-red-light" />
                  <span>
                    <span className="font-display text-2xl font-bold text-white">
                      {categoryCount}
                    </span>{" "}
                    {categoryCount === 1 ? "category" : "categories"}
                  </span>
                </div>
              </div>
            )}
          </AnimateIn>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <GalleryGrid albums={albums} />
      </div>
    </>
  );
}
