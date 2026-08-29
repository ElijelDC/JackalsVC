"use client";

import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD_PX = 48;

export function KitOrderCarouselDots({
  count,
  index,
  onIndexChange,
  ariaLabel,
  className,
}: {
  count: number;
  index: number;
  onIndexChange: (index: number) => void;
  ariaLabel: string;
  className?: string;
}) {
  if (count <= 1) {
    return <span className={cn("block h-2", className)} aria-hidden />;
  }

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length: count }, (_, dotIndex) => (
        <button
          key={dotIndex}
          type="button"
          onClick={() => onIndexChange(dotIndex)}
          className={cn(
            "h-2 rounded-full transition-all",
            index === dotIndex
              ? "w-6 bg-jackals-red"
              : "w-2 bg-white/20 hover:bg-white/35",
          )}
          aria-label={`Show ${ariaLabel} ${dotIndex + 1}`}
          aria-current={index === dotIndex}
        />
      ))}
    </div>
  );
}

export function KitOrderCarousel({
  count,
  index,
  onIndexChange,
  ariaLabel,
  className,
  hideDots = false,
  children,
}: {
  count: number;
  index: number;
  onIndexChange: (index: number) => void;
  ariaLabel: string;
  className?: string;
  hideDots?: boolean;
  children: ReactNode;
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const touchStartX = useRef(0);
  const dragging = useRef(false);
  const hasMultiple = count > 1;

  const goTo = (nextIndex: number) => {
    if (count < 1) return;
    onIndexChange((nextIndex + count) % count);
  };

  return (
    <div className={cn("mx-auto w-full max-w-xl", className)}>
      <div className="relative min-h-0 flex-1">
        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/15 bg-black/70 text-white transition hover:border-jackals-red/50 hover:text-jackals-red-light sm:h-11 sm:w-11"
              aria-label={`Previous ${ariaLabel}`}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/15 bg-black/70 text-white transition hover:border-jackals-red/50 hover:text-jackals-red-light sm:h-11 sm:w-11"
              aria-label={`Next ${ariaLabel}`}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        ) : null}

        <div
          className="h-full touch-pan-y"
          onTouchStart={(event) => {
            if (!hasMultiple) return;
            touchStartX.current = event.touches[0]!.clientX;
            dragging.current = true;
            setDragOffset(0);
          }}
          onTouchMove={(event) => {
            if (!dragging.current) return;
            setDragOffset(event.touches[0]!.clientX - touchStartX.current);
          }}
          onTouchEnd={() => {
            if (!dragging.current) return;
            if (dragOffset <= -SWIPE_THRESHOLD_PX) goTo(index + 1);
            else if (dragOffset >= SWIPE_THRESHOLD_PX) goTo(index - 1);
            dragging.current = false;
            setDragOffset(0);
          }}
          onTouchCancel={() => {
            dragging.current = false;
            setDragOffset(0);
          }}
          aria-roledescription="carousel"
          aria-label={ariaLabel}
        >
          <div
            className="h-full transition-transform duration-200"
            style={{ transform: `translateX(${dragOffset * 0.35}px)` }}
          >
            {children}
          </div>
        </div>
      </div>

      {hideDots ? null : (
        <KitOrderCarouselDots
          count={count}
          index={index}
          onIndexChange={onIndexChange}
          ariaLabel={ariaLabel}
          className="mt-4"
        />
      )}
    </div>
  );
}
