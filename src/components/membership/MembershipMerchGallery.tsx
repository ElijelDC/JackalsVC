"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
} from "lucide-react";
import {
  CLUB_JACKET_FEE_EUR,
  CLUB_JACKET_FULL_PRICE_EUR,
  formatMembershipEuro,
  MEMBERSHIP_CLUB_JACKETS_2026_27,
  MEMBERSHIP_MATCH_KITS_2026_27,
  type MembershipMerchCategory,
  type MembershipMerchItem202627,
} from "@/lib/membership-2026-27";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD_PX = 48;

function ClubJacketPrice({ className }: { className?: string }) {
  return (
    <p className={cn("mt-1 flex flex-wrap items-baseline gap-2", className)}>
      <span className="font-display text-lg text-zinc-500 line-through">
        {formatMembershipEuro(CLUB_JACKET_FULL_PRICE_EUR)}
      </span>
      <span className="font-display text-xl font-bold text-jackals-red-light">
        {formatMembershipEuro(CLUB_JACKET_FEE_EUR)}
      </span>
    </p>
  );
}

function MerchImageLightbox({
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
  const item = items[activeIndex]!;
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

  const content = (
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
        {hasPrev && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/70 text-white transition-colors hover:border-jackals-red/50 hover:text-jackals-red-light sm:left-4"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {hasNext && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/20 bg-black/70 text-white transition-colors hover:border-jackals-red/50 hover:text-jackals-red-light sm:right-4"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageSrc}
          alt={item.imageAlt}
          draggable={false}
          className="max-h-[calc(100dvh-10rem)] max-w-[calc(100dvw-4rem)] object-contain sm:max-w-[min(90vw,56rem)]"
        />
      </div>

      {items.length > 1 ? (
        <p className="shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
          {activeIndex + 1} of {items.length}
        </p>
      ) : null}
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

function MerchPreviewCard({
  item,
  onOpen,
}: {
  item: MembershipMerchItem202627;
  onOpen: () => void;
}) {
  const accentBar =
    item.accent === "purple"
      ? "bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600"
      : "bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red";

  return (
    <article className="flex h-full flex-col overflow-hidden border border-white/10 bg-jackals-surface/90">
      <div aria-hidden className={cn("h-1.5 w-full", accentBar)} />
      <button
        type="button"
        onClick={onOpen}
        className="group relative aspect-[7/6] w-full bg-zinc-950/80 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jackals-red sm:p-7"
        aria-label={`View full size: ${item.title}, ${item.subtitle}`}
      >
        <span className="relative block h-full w-full">
          <Image
            src={item.imageSrc}
            alt={item.imageAlt}
            fill
            className="object-contain object-center transition-opacity group-hover:opacity-90"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </span>
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 border border-white/20 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm transition-colors group-hover:border-jackals-red/50 group-hover:text-jackals-red-light sm:text-[11px]">
          <ZoomIn className="h-3 w-3 shrink-0" />
          View full size
        </span>
      </button>
      <div className="border-t border-white/10 p-4 sm:p-5">
        <h3 className="font-display text-lg font-bold text-white">{item.title}</h3>
        {item.id.startsWith("jacket-") ? (
          <ClubJacketPrice />
        ) : (
          <p className="mt-1 text-sm text-zinc-400">{item.subtitle}</p>
        )}
      </div>
    </article>
  );
}

function KitFilterTabs({
  value,
  onChange,
}: {
  value: MembershipMerchCategory;
  onChange: (value: MembershipMerchCategory) => void;
}) {
  const tabs: { id: MembershipMerchCategory; label: string; activeClass: string }[] = [
    {
      id: "men",
      label: "Men's club kit",
      activeClass: "border-jackals-red/50 bg-jackals-red/15 text-jackals-red-light",
    },
    {
      id: "women",
      label: "Women's kit",
      activeClass: "border-purple-500/50 bg-purple-500/15 text-purple-300",
    },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "min-h-11 border px-4 py-2 text-sm font-medium transition-colors",
            value === tab.id
              ? tab.activeClass
              : "border-white/10 bg-jackals-surface/60 text-zinc-400 hover:border-white/20 hover:text-white",
          )}
          aria-pressed={value === tab.id}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function MerchCarousel({
  items,
  onOpen,
  ariaLabel,
}: {
  items: MembershipMerchItem202627[];
  onOpen: (index: number) => void;
  ariaLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const draggingHorizontally = useRef(false);

  const item = items[index]!;
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
    if (draggingHorizontally.current) setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (draggingHorizontally.current) {
      if (dragOffset <= -SWIPE_THRESHOLD_PX) goTo(index + 1);
      else if (dragOffset >= SWIPE_THRESHOLD_PX) goTo(index - 1);
    }
    setDragOffset(0);
    setIsDragging(false);
    draggingHorizontally.current = false;
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="relative">
        {hasMultiple ? (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="absolute left-0 top-1/2 z-10 hidden -translate-x-full -translate-y-1/2 pr-3 text-zinc-400 transition-colors hover:text-white sm:flex"
              aria-label="Previous jacket"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="absolute right-0 top-1/2 z-10 hidden translate-x-full -translate-y-1/2 pl-3 text-zinc-400 transition-colors hover:text-white sm:flex"
              aria-label="Next jacket"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </>
        ) : null}

        <div
          className="overflow-hidden touch-pan-y"
          onTouchStart={(event) =>
            handleTouchStart(event.touches[0]!.clientX, event.touches[0]!.clientY)
          }
          onTouchMove={(event) =>
            handleTouchMove(event.touches[0]!.clientX, event.touches[0]!.clientY)
          }
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          aria-roledescription="carousel"
          aria-label={ariaLabel}
        >
          <div
            className={cn(
              "flex will-change-transform",
              isDragging
                ? "transition-none"
                : "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            )}
            style={{ transform: `translateX(calc(-${index * 100}% + ${dragOffset}px))` }}
          >
            {items.map((carouselItem, carouselIndex) => (
              <div
                key={carouselItem.id}
                className="w-full shrink-0 px-1"
                aria-hidden={carouselIndex !== index}
              >
                <MerchPreviewCard item={carouselItem} onOpen={() => onOpen(carouselIndex)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {hasMultiple ? (
        <div className="mt-5 flex flex-col items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {index + 1} / {items.length} · {item.title}
          </p>
          <div className="flex items-center justify-center gap-2">
            {items.map((carouselItem, carouselIndex) => (
              <button
                key={carouselItem.id}
                type="button"
                onClick={() => goTo(carouselIndex)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  carouselIndex === index
                    ? "w-6 bg-jackals-red"
                    : "w-2 bg-white/20 hover:bg-white/35",
                )}
                aria-label={`Show ${carouselItem.title}`}
                aria-current={carouselIndex === index}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MembershipMerchGallery({ embedded = false }: { embedded?: boolean }) {
  const [kitFilter, setKitFilter] = useState<MembershipMerchCategory>("men");
  const [lightboxItems, setLightboxItems] = useState<MembershipMerchItem202627[] | null>(
    null,
  );
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const filteredKits = MEMBERSHIP_MATCH_KITS_2026_27.filter(
    (item) => item.category === kitFilter,
  );

  const openLightbox = (items: MembershipMerchItem202627[], index: number) => {
    setLightboxItems(items);
    setLightboxIndex(index);
  };

  const closeLightbox = () => setLightboxItems(null);

  return (
    <>
      <div className={cn("mx-auto space-y-12", embedded ? "max-w-6xl p-4 sm:p-6" : "mt-10 max-w-6xl")}>
        <div>
          <div className="mb-6 text-center md:mb-8">
            <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
              Match kits
            </h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Custom Jackal-Legea sublimated jersey and shorts —
              <span className="text-jackals-red-light"> black &amp; red</span>
              {" "}for the men&apos;s club kit,
              <span className="text-purple-400"> black &amp; purple</span>
              {" "}for the women&apos;s kit. Each squad gets home and libero designs.
            </p>
          </div>

          <div className="mb-6">
            <KitFilterTabs value={kitFilter} onChange={setKitFilter} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {filteredKits.map((item, itemIndex) => (
              <MerchPreviewCard
                key={item.id}
                item={item}
                onOpen={() => openLightbox(filteredKits, itemIndex)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-6 text-center md:mb-8">
            <h3 className="font-display text-xl font-bold text-white sm:text-2xl">
              Club jackets
            </h3>
            <p className="mt-2 text-sm text-zinc-400 sm:text-base">
              Optional Legea off-court layer — 4 different variants. Prices below
              include the reduced member rate.
            </p>
          </div>

          <MerchCarousel
            items={MEMBERSHIP_CLUB_JACKETS_2026_27}
            ariaLabel="Club jacket styles"
            onOpen={(index) => openLightbox(MEMBERSHIP_CLUB_JACKETS_2026_27, index)}
          />
        </div>
      </div>

      {lightboxItems ? (
        <MerchImageLightbox
          items={lightboxItems}
          activeIndex={lightboxIndex}
          onClose={closeLightbox}
          onChangeIndex={setLightboxIndex}
        />
      ) : null}
    </>
  );
}

export function MembershipMerchCollapsible() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="overflow-hidden border border-white/10 bg-jackals-surface/90">
      <div className="p-5 text-center sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          2026/27
        </p>
        <h3 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
          Kit &amp; merch
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
          Premium Legea designs for the season — what your squad wears on court and off it.
        </p>
        <button
          type="button"
          className="mt-5 inline-flex min-h-11 items-center gap-2 border border-white/15 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:border-jackals-red/45 hover:bg-jackals-red/10"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide" : "View"} kit &amp; merch
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </div>
      <div id={panelId} hidden={!open} className="border-t border-white/10">
        {open ? <MembershipMerchGallery embedded /> : null}
      </div>
    </div>
  );
}
