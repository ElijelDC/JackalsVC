"use client";

import Link from "next/link";
import { ArrowLeft, Camera, Images } from "lucide-react";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { GalleryCoverImage } from "@/components/gallery/GalleryCoverImage";
import {
  GalleryPhotoGrid,
} from "@/components/gallery/GalleryPhotoGrid";
import type { GalleryPhotoItem } from "@/components/gallery/types";
import { fillImageStyle } from "@/lib/fill-image-layout";
import { formatCategoryLabel } from "@/lib/utils";

export type GalleryAlbumDetail = {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string;
  category: string;
  photos: GalleryPhotoItem[];
};

export function GalleryAlbumDetailView({ album }: { album: GalleryAlbumDetail }) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-background hero-bg">
        <div
          aria-hidden
          className="motion-hero-glow pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(232,34,42,0.22),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 home-hero-grid opacity-30"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <AnimateIn immediate variant="slide-left">
            <Link
              href="/gallery"
              className="mb-8 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 backdrop-blur-sm transition-colors hover:border-jackals-red/40 hover:text-jackals-red-light clip-slash-reverse"
            >
              <ArrowLeft className="h-4 w-4" />
              All albums
            </Link>
          </AnimateIn>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <AnimateIn immediate variant="scale-in" delay={80}>
              <div
                className="relative aspect-[4/3] overflow-hidden border border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
                style={fillImageStyle("4 / 3")}
              >
                <GalleryCoverImage
                  src={album.coverImageUrl}
                  alt={album.title}
                  className="h-full w-full"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </AnimateIn>

            <AnimateIn immediate variant="slide-right" delay={140}>
              <div className="inline-flex items-center gap-2 border border-jackals-red/40 bg-jackals-red/10 px-4 py-2 text-sm font-medium text-jackals-red-light clip-slash-reverse">
                <Camera className="h-4 w-4" />
                {formatCategoryLabel(album.category)}
              </div>
              <h1 className="font-display mt-5 text-3xl font-bold tracking-wide text-white sm:text-4xl lg:text-5xl">
                {album.title}
              </h1>
              {album.description && (
                <p className="mt-4 text-lg leading-relaxed text-zinc-400">
                  {album.description}
                </p>
              )}
              <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
                <Images className="h-4 w-4 text-jackals-red-light" />
                <span>
                  {album.photos.length}{" "}
                  {album.photos.length === 1 ? "photo" : "photos"} in this album
                </span>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <AnimateIn variant="blur-in">
          <h2 className="font-display mb-8 text-2xl font-bold text-white sm:text-3xl">
            Photos
          </h2>
          <GalleryPhotoGrid photos={album.photos} />
        </AnimateIn>
      </div>
    </>
  );
}
