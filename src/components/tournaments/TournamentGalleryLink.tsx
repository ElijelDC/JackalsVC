import Link from "next/link";
import { GalleryAlbumCard } from "@/components/gallery/GalleryAlbumCard";
import { AnimateIn } from "@/components/motion/AnimateIn";

export type TournamentGalleryAlbumTeaser = {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string;
  category: string;
  photoCount: number;
};

export function TournamentGalleryLink({
  album,
}: {
  album: TournamentGalleryAlbumTeaser;
}) {
  return (
    <section className="border-t border-white/10 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <AnimateIn variant="blur-in" className="mb-8 text-center sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            Full day gallery
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
            Tournament album
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            More photos from the day — open the full album in the club gallery.
          </p>
        </AnimateIn>

        <AnimateIn variant="spring-up">
          <GalleryAlbumCard album={album} />
        </AnimateIn>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Or browse{" "}
          <Link
            href="/gallery"
            className="text-jackals-red-light transition-colors hover:text-white"
          >
            all gallery albums
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
