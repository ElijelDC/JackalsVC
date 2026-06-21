"use client";

import { useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { FilterPills } from "@/components/ui/FilterPills";
import {
  GalleryAlbumCard,
  type GalleryAlbumItem,
} from "@/components/gallery/GalleryAlbumCard";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";

const CATEGORIES = ["ALL", "MATCH", "TRAINING", "SOCIAL", "EVENT"] as const;

export function GalleryGrid({ albums }: { albums: GalleryAlbumItem[] }) {
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return albums.filter((album) => {
      const matchesCategory =
        filter === "ALL" || album.category === filter;
      const matchesName = matchesAdminSearch(search, album.title);
      return matchesCategory && matchesName;
    });
  }, [albums, filter, search]);

  const filtersActive = Boolean(search.trim()) || filter !== "ALL";

  return (
    <>
      <AnimateIn immediate className="mb-6">
        <AdminSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search albums by name…"
        />
      </AnimateIn>

      <AnimateIn immediate>
        <FilterPills
          options={[...CATEGORIES]}
          active={filter}
          onChange={setFilter}
          className="mb-10"
        />
      </AnimateIn>

      {filtered.length === 0 ? (
        <AnimateIn delay={50}>
          <div className="relative overflow-hidden border border-dashed border-white/15 bg-jackals-surface/40 px-8 py-16 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(232,34,42,0.08),transparent_70%)]"
            />
            <ImageIcon className="relative mx-auto h-10 w-10 text-jackals-red-light/60" />
            <p className="relative mt-4 font-display text-lg font-semibold text-white">
              {filtersActive ? "No albums found" : "No albums yet"}
            </p>
            <p className="relative mt-2 text-sm text-zinc-500">
              {filtersActive
                ? "Try a different search or category filter."
                : "Check back after the next event."}
            </p>
          </div>
        </AnimateIn>
      ) : (
        <StaggerIn className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={80}>
          {filtered.map((album) => (
            <GalleryAlbumCard key={album.id} album={album} />
          ))}
        </StaggerIn>
      )}
    </>
  );
}
