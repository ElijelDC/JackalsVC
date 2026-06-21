import Link from "next/link";
import { ArrowRight, Images } from "lucide-react";
import { GalleryCoverImage } from "@/components/gallery/GalleryCoverImage";
import { fillImageStyle } from "@/lib/fill-image-layout";
import { formatCategoryLabel } from "@/lib/utils";

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
          <div className="absolute left-3 top-3 z-10 inline-flex items-center border border-jackals-red/30 bg-black/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-jackals-red-light backdrop-blur-sm">
            {formatCategoryLabel(album.category)}
          </div>
          <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <Images className="h-3.5 w-3.5 text-jackals-red-light" />
            {album.photoCount}
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
            <h3 className="font-display text-lg font-bold text-white sm:text-xl">
              {album.title}
            </h3>
            {album.description && (
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-300">
                {album.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-jackals-inset/40 px-5 py-4">
          <span className="text-sm font-semibold uppercase tracking-wide text-jackals-red-light transition-colors group-hover:text-white">
            View album
          </span>
          <ArrowRight className="h-4 w-4 text-jackals-red-light transition-transform group-hover:translate-x-1" />
        </div>
      </article>
    </Link>
  );
}
