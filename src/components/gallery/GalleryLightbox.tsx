"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryPhotoItem } from "@/components/gallery/types";

export function GalleryLightbox({
  photos,
  activeIndex,
  onClose,
  onChangeIndex,
}: {
  photos: GalleryPhotoItem[];
  activeIndex: number;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
}) {
  const photo = photos[activeIndex];
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < photos.length - 1;
  const label = photo.title ?? photo.caption ?? "Gallery photo";

  const goPrev = useCallback(() => {
    if (hasPrev) onChangeIndex(activeIndex - 1);
  }, [activeIndex, hasPrev, onChangeIndex]);

  const goNext = useCallback(() => {
    if (hasNext) onChangeIndex(activeIndex + 1);
  }, [activeIndex, hasNext, onChangeIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, goPrev, goNext]);

  const content = (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="text-xs font-medium uppercase tracking-wider text-jackals-red-light sm:text-sm">
          {activeIndex + 1} of {photos.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center gap-2 border border-white/20 bg-black/60 px-3 py-2 text-sm font-medium text-white transition-colors hover:border-jackals-red/50 hover:text-jackals-red-light sm:min-w-0"
          aria-label="Close gallery"
        >
          <X className="h-5 w-5 shrink-0" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-12 py-4 sm:px-16"
        onClick={onClose}
      >
        {hasPrev && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goPrev();
            }}
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/70 text-white transition-colors hover:border-jackals-red/50 hover:text-jackals-red-light sm:left-4 sm:h-12 sm:w-12"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
        )}

        {hasNext && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/70 text-white transition-colors hover:border-jackals-red/50 hover:text-jackals-red-light sm:right-4 sm:h-12 sm:w-12"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.imageUrl}
          alt={label}
          draggable={false}
          onClick={(event) => event.stopPropagation()}
          className="max-h-[calc(100dvh-12rem)] max-w-[calc(100dvw-6rem)] touch-manipulation object-contain sm:max-h-[calc(100dvh-11rem)] sm:max-w-[calc(100dvw-10rem)]"
        />
      </div>

      {(photo.title || photo.caption) && (
        <div
          className="shrink-0 border-t border-white/10 bg-black/80 px-4 py-4 text-center pb-[max(1rem,env(safe-area-inset-bottom))] sm:py-5"
          onClick={(event) => event.stopPropagation()}
        >
          {photo.title && (
            <p className="font-display text-lg font-bold text-white sm:text-xl">
              {photo.title}
            </p>
          )}
          {photo.caption && (
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              {photo.caption}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(content, document.body);
}
