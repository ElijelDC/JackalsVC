import Image from "next/image";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import type { TournamentArchiveEntry } from "@/lib/tournament-archive";

export function TournamentWinnerGallery({
  photos,
}: {
  photos: TournamentArchiveEntry["winnerPhotos"];
}) {
  return (
    <section className="border-t border-white/10 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateIn variant="blur-in" className="mb-10 text-center sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            Gallery
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Winner photos
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Podium moments from the day — champions, runners-up, and bronze.
          </p>
        </AnimateIn>

        {photos.length === 0 ? (
          <AnimateIn variant="pop-in">
            <div className="border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center sm:px-10">
              <p className="font-display text-xl font-bold text-white">
                Photos coming soon
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                Winner and podium shots from the day will appear here shortly.
              </p>
            </div>
          </AnimateIn>
        ) : (
          <StaggerIn
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            stagger={70}
            variant="pop"
          >
            {photos.map((photo) => (
              <figure
                key={photo.src}
                className="group relative aspect-[4/3] overflow-hidden border border-white/10 bg-white/[0.02]"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 text-xs text-zinc-200">
                  {photo.alt}
                </figcaption>
              </figure>
            ))}
          </StaggerIn>
        )}
      </div>
    </section>
  );
}
