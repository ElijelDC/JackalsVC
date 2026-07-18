"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Mail, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  SPONSOR_PACKAGES,
  sponsorInquiryMailto,
} from "@/lib/sponsors-config";

const SWIPE_THRESHOLD_PX = 48;

type SponsorPackage = (typeof SPONSOR_PACKAGES)[number];

function PackageCard({
  item,
  index,
  onPreview,
  interactive = true,
}: {
  item: SponsorPackage;
  index: number;
  onPreview: (pack: SponsorPackage) => void;
  /** When false, hide focusable controls (offscreen carousel slides). */
  interactive?: boolean;
}) {
  const featured = index === SPONSOR_PACKAGES.length - 1;

  return (
    <article
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden border border-white/10 bg-white/[0.02]",
        featured &&
          "border-jackals-red/45 bg-jackals-red/[0.08] shadow-[0_0_40px_rgba(232,34,42,0.12)]",
      )}
    >
      <button
        type="button"
        onClick={() => onPreview(item)}
        className="group relative w-full border-b border-white/10 bg-black/50 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jackals-red"
        aria-label={`View ${item.name} example larger`}
        tabIndex={interactive ? 0 : -1}
      >
        <Image
          src={item.exampleImage}
          alt={item.exampleAlt}
          width={3200}
          height={2000}
          className="h-auto w-full transition-opacity duration-300 group-hover:opacity-95"
          sizes="(max-width: 1023px) 100vw, 33vw"
          priority={index === 0}
        />
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 border border-white/20 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm transition-colors group-hover:border-jackals-red/50 group-hover:text-jackals-red-light sm:bottom-3 sm:left-3 sm:px-2.5 sm:py-1.5 sm:text-[11px]">
          <ZoomIn className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
          View example
        </span>
      </button>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
          Investment
        </p>
        <p className="mt-2 font-display text-3xl font-bold text-white">
          {item.priceLabel}
        </p>
        <h3 className="mt-3 font-display text-xl font-bold text-white">
          {item.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {item.summary}
        </p>
        <ul className="mt-5 flex-1 space-y-2.5 text-sm text-zinc-300">
          {item.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-2">
              <span
                aria-hidden
                className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-jackals-red"
              />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
        <a
          href={sponsorInquiryMailto(`${item.name} sponsorship enquiry`)}
          className="mt-auto block pt-6"
          tabIndex={interactive ? 0 : -1}
        >
          <Button
            variant={featured ? "primary" : "outline"}
            size="sm"
            className="w-full gap-2"
          >
            <Mail className="h-4 w-4" />
            Enquire
          </Button>
        </a>
      </div>
    </article>
  );
}

export function SponsorPackagesCarousel({
  onPreview,
}: {
  onPreview: (pack: SponsorPackage) => void;
}) {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const draggingHorizontally = useRef(false);
  const suppressClick = useRef(false);

  const pack = SPONSOR_PACKAGES[index]!;
  const hasMultiple = SPONSOR_PACKAGES.length > 1;

  const goTo = (nextIndex: number) => {
    setIndex((nextIndex + SPONSOR_PACKAGES.length) % SPONSOR_PACKAGES.length);
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
    <>
      {/* Mobile / tablet: carousel — full width so example slides stay readable */}
      <div className="mx-auto w-full max-w-3xl lg:hidden">
        <div
          className="overflow-hidden touch-pan-y"
          onTouchStart={(event) =>
            handleTouchStart(
              event.touches[0]!.clientX,
              event.touches[0]!.clientY,
            )
          }
          onTouchMove={(event) =>
            handleTouchMove(
              event.touches[0]!.clientX,
              event.touches[0]!.clientY,
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
          aria-label="Sponsorship packages"
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
            {SPONSOR_PACKAGES.map((item, itemIndex) => (
              <div
                key={item.name}
                className="w-full shrink-0 select-none px-1"
                aria-hidden={itemIndex !== index}
              >
                <PackageCard
                  item={item}
                  index={itemIndex}
                  onPreview={onPreview}
                  interactive={itemIndex === index}
                />
              </div>
            ))}
          </div>
        </div>

        {hasMultiple ? (
          <div className="mt-5 flex flex-col items-center gap-3">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              {index + 1} / {SPONSOR_PACKAGES.length} · {pack.name}
            </p>
            <div className="flex items-center justify-center gap-2">
              {SPONSOR_PACKAGES.map((item, itemIndex) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => goTo(itemIndex)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    itemIndex === index
                      ? "w-6 bg-jackals-red"
                      : "w-2 bg-white/20 hover:bg-white/35",
                  )}
                  aria-label={`Show ${item.name}`}
                  aria-current={itemIndex === index}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Desktop: all three plans */}
      <div className="hidden auto-rows-fr grid-cols-3 items-stretch gap-6 lg:grid">
        {SPONSOR_PACKAGES.map((item, itemIndex) => (
          <PackageCard
            key={item.name}
            item={item}
            index={itemIndex}
            onPreview={onPreview}
          />
        ))}
      </div>
    </>
  );
}
