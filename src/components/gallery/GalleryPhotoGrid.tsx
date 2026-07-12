"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn } from "lucide-react";
import { GalleryImage } from "@/components/gallery/GalleryImage";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import type { GalleryPhotoItem } from "@/components/gallery/types";
import { useInView } from "@/hooks/useInView";
import { fillImageStyle } from "@/lib/fill-image-layout";
import { cn } from "@/lib/utils";

export type { GalleryPhotoItem };

const PRIORITY_TILE_COUNT = 4;

function scrollPhotoTileIntoView(element: HTMLButtonElement | undefined) {
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
  element?.scrollIntoView({ behavior, block: "center" });
}

function GalleryPhotoTile({
  photo,
  index,
  onOpen,
  tileRef,
}: {
  photo: GalleryPhotoItem;
  index: number;
  onOpen: () => void;
  tileRef: (element: HTMLButtonElement | null) => void;
}) {
  const { ref, inView } = useInView();
  const label = photo.caption ?? "Gallery photo";

  return (
    <button
      ref={tileRef}
      type="button"
      onClick={onOpen}
      className="motion-hover-lift group relative w-full scroll-mt-28 overflow-hidden border border-white/10 bg-jackals-surface/90 text-left shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-jackals-red/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-jackals-red/60"
      aria-label={`View full size: ${label}`}
    >
      <div
        ref={ref}
        className="relative aspect-[4/3] overflow-hidden bg-jackals-inset"
        style={fillImageStyle("4 / 3")}
      >
        {inView ? (
          <GalleryImage
            src={photo.imageUrl}
            alt={label}
            priority={index < PRIORITY_TILE_COUNT}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden
            className="h-full w-full animate-pulse bg-gradient-to-br from-jackals-inset to-jackals-surface"
          />
        )}
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 transition-opacity group-hover:opacity-100",
            photo.caption
              ? "bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80"
              : "bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100",
          )}
        />
        <div className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center border border-white/20 bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-4 w-4" />
        </div>
        {photo.caption && (
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="line-clamp-2 text-xs leading-relaxed text-zinc-200 sm:text-sm">
              {photo.caption}
            </p>
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
            index={index}
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
