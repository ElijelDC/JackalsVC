"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { INFO_NAV_ITEMS, NAV_ITEMS } from "@/lib/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export type FeatureCarouselItem = {
  href: string;
  label: string;
  description?: string;
};

const FEATURE_ICON_BY_HREF = new Map<string, LucideIcon>(
  [...NAV_ITEMS, ...INFO_NAV_ITEMS].map((item) => [item.href, item.icon]),
);

const SWIPE_THRESHOLD_PX = 48;

function FeatureCard({ href, label, description }: FeatureCarouselItem) {
  const Icon = FEATURE_ICON_BY_HREF.get(href) ?? ArrowRight;

  return (
    <Link href={href} className="group block h-full">
      <Card className="motion-hover-pop motion-shine relative h-full overflow-hidden border-white/10 bg-jackals-surface/80 p-5 group-hover:border-jackals-red/35 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-6">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-jackals-red/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        />
        <div className="motion-icon-pop mb-4 flex h-11 w-11 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse transition-colors group-hover:bg-jackals-red/25">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="flex items-center justify-between gap-2">
          {label}
          <ArrowRight className="h-4 w-4 shrink-0 text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-jackals-red-light" />
        </CardTitle>
        <CardDescription className="mt-2 text-sm leading-relaxed">
          {description}
        </CardDescription>
      </Card>
    </Link>
  );
}

export function FeatureCarousel({ items }: { items: FeatureCarouselItem[] }) {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const draggingHorizontally = useRef(false);
  const suppressClick = useRef(false);

  if (items.length === 0) {
    return null;
  }

  const hasMultiple = items.length > 1;

  const goTo = (nextIndex: number) => {
    setIndex((nextIndex + items.length) % items.length);
  };

  const handleTouchStart = (clientX: number, clientY: number) => {
    touchStartX.current = clientX;
    touchStartY.current = clientY;
    draggingHorizontally.current = false;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const deltaX = clientX - touchStartX.current;
    const deltaY = clientY - touchStartY.current;

    if (!draggingHorizontally.current) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;
      draggingHorizontally.current = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (draggingHorizontally.current) {
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (draggingHorizontally.current) {
      if (dragOffset <= -SWIPE_THRESHOLD_PX) {
        goTo(index + 1);
        suppressClick.current = true;
      } else if (dragOffset >= SWIPE_THRESHOLD_PX) {
        goTo(index - 1);
        suppressClick.current = true;
      }
    }

    setDragOffset(0);
    setIsDragging(false);
    draggingHorizontally.current = false;
  };

  return (
    <div className="max-w-xl">
      <div
        className="overflow-hidden touch-pan-y"
        onTouchStart={(event) =>
          handleTouchStart(
            event.touches[0].clientX,
            event.touches[0].clientY,
          )
        }
        onTouchMove={(event) =>
          handleTouchMove(
            event.touches[0].clientX,
            event.touches[0].clientY,
          )
        }
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
        aria-roledescription="carousel"
        aria-label="Browse club sections"
      >
        <div
          className={cn(
            "flex will-change-transform",
            isDragging
              ? "transition-none"
              : "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          )}
          style={{
            transform: `translateX(calc(-${index * 100}% + ${dragOffset}px))`,
          }}
        >
          {items.map((item) => (
            <div
              key={item.href}
              className="w-full shrink-0 select-none"
              aria-hidden={item.href !== items[index].href}
            >
              <FeatureCard {...item} />
            </div>
          ))}
        </div>
      </div>

      {hasMultiple && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {items.map((item, itemIndex) => (
            <button
              key={item.href}
              type="button"
              onClick={() => goTo(itemIndex)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                itemIndex === index
                  ? "w-6 bg-jackals-red"
                  : "w-2 bg-white/20 hover:bg-white/35",
              )}
              aria-label={`Show ${item.label}`}
              aria-current={itemIndex === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
