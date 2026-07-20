"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import type { GalleryPhotoItem } from "@/components/gallery/types";
import { AnimateIn } from "@/components/motion/AnimateIn";
import type { TournamentArchiveEntry } from "@/lib/tournament-archive";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD_PX = 48;

type WinnerPhoto = TournamentArchiveEntry["winnerPhotos"][number];

function WinnerPhotoSlide({
  photo,
  priority,
  onOpen,
}: {
  photo: WinnerPhoto;
  priority?: boolean;
  onOpen?: () => void;
}) {
  const content = (
    <>
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        sizes="(max-width: 1024px) 100vw, 720px"
        priority={priority}
        unoptimized={photo.src.startsWith("/uploads/")}
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-4 pt-12 text-sm text-zinc-100">
        {photo.alt}
      </figcaption>
    </>
  );

  if (!onOpen) {
    return (
      <figure className="relative aspect-[4/3] overflow-hidden border border-white/10 bg-white/[0.02]">
        {content}
      </figure>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden border border-white/10 bg-white/[0.02] text-left transition-colors hover:border-jackals-red/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-jackals-red/60"
      aria-label={`View larger: ${photo.alt}`}
    >
      <figure className="relative aspect-[4/3]">{content}</figure>
    </button>
  );
}

function WinnerPhotoCarousel({
  photos,
  onOpen,
}: {
  photos: WinnerPhoto[];
  onOpen: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const draggingHorizontally = useRef(false);
  const didSwipe = useRef(false);

  const goTo = (nextIndex: number) => {
    setIndex((nextIndex + photos.length) % photos.length);
  };

  const handleTouchStart = (clientX: number, clientY: number) => {
    touchStartX.current = clientX;
    touchStartY.current = clientY;
    draggingHorizontally.current = false;
    didSwipe.current = false;
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
        didSwipe.current = true;
      } else if (dragOffset >= SWIPE_THRESHOLD_PX) {
        goTo(index - 1);
        didSwipe.current = true;
      }
    }
    setDragOffset(0);
    setIsDragging(false);
    draggingHorizontally.current = false;
  };

  return (
    <div>
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
        aria-label="Winner photos"
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
          {photos.map((photo, photoIndex) => (
            <div
              key={`${photo.src}-${photoIndex}`}
              className="w-full shrink-0 select-none px-0.5"
              aria-hidden={photoIndex !== index}
            >
              <WinnerPhotoSlide
                photo={photo}
                priority={photoIndex === 0}
                onOpen={() => {
                  if (didSwipe.current) return;
                  onOpen(photoIndex);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {photos.length > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-2">
          {photos.map((photo, photoIndex) => (
            <button
              key={`${photo.src}-dot-${photoIndex}`}
              type="button"
              onClick={() => goTo(photoIndex)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                photoIndex === index
                  ? "w-6 bg-jackals-red"
                  : "w-2 bg-white/20 hover:bg-white/35",
              )}
              aria-label={`Show photo ${photoIndex + 1}`}
              aria-current={photoIndex === index}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function desktopGridClass(count: number) {
  if (count === 1) return "lg:mx-auto lg:max-w-xl lg:grid-cols-1";
  if (count === 2) return "lg:grid-cols-2";
  if (count === 3) return "lg:grid-cols-3";
  if (count === 4) return "lg:grid-cols-2 xl:grid-cols-4";
  return "lg:grid-cols-3";
}

export function TournamentWinnerGallery({
  photos,
}: {
  photos: WinnerPhoto[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const lightboxPhotos = useMemo<GalleryPhotoItem[]>(
    () =>
      photos.map((photo, index) => ({
        id: `winner-${index}`,
        title: null,
        caption: photo.alt,
        imageUrl: photo.src,
      })),
    [photos],
  );

  if (photos.length === 0) return null;

  return (
    <section className="border-b border-white/10 bg-jackals-surface/20 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateIn variant="blur-in" className="mb-8 text-center sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            Gallery
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Winner photos
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Podium moments from the day — click a photo to view it larger.
          </p>
        </AnimateIn>

        {/* Mobile: carousel */}
        <div className="lg:hidden">
          <WinnerPhotoCarousel
            photos={photos}
            onOpen={(index) => setActiveIndex(index)}
          />
        </div>

        {/* Desktop: always static grid (never a carousel) */}
        <div
          className={cn(
            "hidden gap-4 lg:grid",
            desktopGridClass(photos.length),
          )}
        >
          {photos.map((photo, photoIndex) => (
            <WinnerPhotoSlide
              key={`${photo.src}-row-${photoIndex}`}
              photo={photo}
              priority={photoIndex === 0}
              onOpen={() => setActiveIndex(photoIndex)}
            />
          ))}
        </div>
      </div>

      {activeIndex !== null ? (
        <GalleryLightbox
          photos={lightboxPhotos}
          activeIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
          onChangeIndex={setActiveIndex}
        />
      ) : null}
    </section>
  );
}
