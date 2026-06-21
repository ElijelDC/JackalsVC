"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import type { GalleryPhotoItem } from "@/components/gallery/types";
import { ProductPlaceholder } from "@/components/shop/ProductPlaceholder";
import { cn } from "@/lib/utils";

export type { GalleryPhotoItem };

function scrollPhotoTileIntoView(element: HTMLButtonElement | undefined) {
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
  element?.scrollIntoView({ behavior, block: "center" });
}

function GalleryPhotoTile({
  photo,
  onOpen,
  tileRef,
}: {
  photo: GalleryPhotoItem;
  onOpen: () => void;
  tileRef: (element: HTMLButtonElement | null) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const label = photo.title ?? photo.caption ?? "Gallery photo";

  return (
    <button
      ref={tileRef}
      type="button"
      onClick={onOpen}
      className="motion-hover-lift group relative w-full scroll-mt-28 overflow-hidden border border-white/10 bg-jackals-surface/90 text-left shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-jackals-red/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-jackals-red/60"
      aria-label={`View full size: ${label}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-jackals-inset">
        {imageError ? (
          <ProductPlaceholder className="h-full w-full" size="md" />
        ) : (
          <Image
            src={photo.imageUrl}
            alt={label}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setImageError(true)}
          />
        )}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100",
          )}
        />
        <div className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center border border-white/20 bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-4 w-4" />
        </div>
        {(photo.title || photo.caption) && (
          <div className="absolute inset-x-0 bottom-0 p-4">
            {photo.title && (
              <p className="font-display text-sm font-bold text-white sm:text-base">
                {photo.title}
              </p>
            )}
            {photo.caption && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-300 sm:text-sm">
                {photo.caption}
              </p>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

export function GalleryPhotoGrid({ photos }: { photos: GalleryPhotoItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const tileRefs = useRef(new Map<string, HTMLButtonElement>());

  const registerTileRef = useCallback(
    (photoId: string) => (element: HTMLButtonElement | null) => {
      if (element) {
        tileRefs.current.set(photoId, element);
      } else {
        tileRefs.current.delete(photoId);
      }
    },
    [],
  );

  const focusTile = useCallback(
    (index: number, scroll = true) => {
      const photo = photos[index];
      const element = tileRefs.current.get(photo.id);
      if (!element) return;

      if (scroll) {
        scrollPhotoTileIntoView(element);
      }
      element.focus({ preventScroll: !scroll });
    },
    [photos],
  );

  const openPhoto = useCallback(
    (index: number) => {
      focusTile(index);
      window.setTimeout(() => setActiveIndex(index), 150);
    },
    [focusTile],
  );

  const closeLightbox = useCallback(() => {
    const index = activeIndex;
    setActiveIndex(null);

    if (index === null) return;

    window.setTimeout(() => focusTile(index, false), 100);
  }, [activeIndex, focusTile]);

  const changePhoto = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  if (photos.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No photos in this album yet — check back soon.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo, index) => (
          <GalleryPhotoTile
            key={photo.id}
            photo={photo}
            tileRef={registerTileRef(photo.id)}
            onOpen={() => openPhoto(index)}
          />
        ))}
      </div>

      {activeIndex !== null && (
        <GalleryLightbox
          photos={photos}
          activeIndex={activeIndex}
          onClose={closeLightbox}
          onChangeIndex={changePhoto}
        />
      )}
    </>
  );
}
