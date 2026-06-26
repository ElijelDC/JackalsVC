import Link from "next/link";
import { ArrowRight, Images } from "lucide-react";
import { GalleryCoverImage } from "@/components/gallery/GalleryCoverImage";
import { fillImageStyle } from "@/lib/fill-image-layout";

export type GalleryAlbumItem = {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string;
  category: string;
  photoCount: number;
};

export function GalleryAlbumCard({ album }: { album: GalleryAlbumItem }) {
  return (
    <Link href={`/gallery/${album.id}`} className="group block h-full">
      <article className="motion-hover-lift relative flex h-full flex-col overflow-hidden border border-white/10 bg-jackals-surface/90 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-jackals-red/40 hover:shadow-[0_24px_70px_rgba(232,34,42,0.12)]">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-jackals-red via-jackals-red-light to-jackals-red"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 z-10 h-48 w-48 rounded-full bg-jackals-red/10 blur-3xl opacity-60 transition-opacity group-hover:opacity-100"
        />

        <div
          className="relative aspect-[4/3]"
          style={fillImageStyle("4 / 3")}
        >
          <GalleryCoverImage
            src={album.coverImageUrl}
            alt={album.title}
            className="h-full w-full"
          />
          <div className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 border border-white/20 bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs">
            <Images className="h-3 w-3 text-jackals-red-light sm:h-3.5 sm:w-3.5" />
            {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 p-2 sm:p-5">
            <h3 className="line-clamp-2 font-display text-sm font-bold leading-snug text-white sm:text-xl">
              {album.title}
            </h3>
            {album.description && (
              <p className="mt-1 hidden line-clamp-2 text-sm leading-relaxed text-zinc-300 sm:block">
                {album.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-jackals-inset/40 px-3 py-2.5 sm:px-5 sm:py-4">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-jackals-red-light transition-colors group-hover:text-white sm:text-sm">
            View album
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-jackals-red-light transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4" />
        </div>
      </article>
    </Link>
  );
}
