"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { MembershipMerchItem202627 } from "@/lib/membership-2026-27";

export function KitOrderImageLightbox({
  items,
  activeIndex,
  onClose,
  onChangeIndex,
}: {
  items: MembershipMerchItem202627[];
  activeIndex: number;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
}) {
  const item = items[activeIndex];
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < items.length - 1;

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

  if (typeof document === "undefined" || !item) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={item.imageAlt}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="min-w-0 text-left">
          <p className="truncate text-sm font-semibold text-white">{item.title}</p>
          <p className="truncate text-xs text-zinc-400">{item.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center border border-white/20 bg-black/60 text-white transition-colors hover:border-jackals-red/50 hover:text-jackals-red-light"
          aria-label="Close preview"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 py-4 sm:px-16">
        {hasPrev ? (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/70 text-white transition-colors hover:border-jackals-red/50 hover:text-jackals-red-light sm:left-4"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : null}

        {hasNext ? (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/70 text-white transition-colors hover:border-jackals-red/50 hover:text-jackals-red-light sm:right-4"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageSrc}
          alt={item.imageAlt}
          draggable={false}
          className="max-h-[calc(100dvh-10rem)] max-w-[calc(100dvw-4rem)] object-contain sm:max-w-[min(92vw,64rem)]"
        />
      </div>

      {items.length > 1 ? (
        <p className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
          {activeIndex + 1} of {items.length}
        </p>
      ) : null}
    </div>,
    document.body,
  );
}
