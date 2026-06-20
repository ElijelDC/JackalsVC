"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FilterPills } from "@/components/ui/FilterPills";
import { Badge } from "@/components/ui/Badge";
import { ProductPlaceholder } from "@/components/shop/ProductPlaceholder";

type GalleryItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  category: string;
};

const CATEGORIES = ["ALL", "MATCH", "TRAINING", "SOCIAL", "EVENT"] as const;

export function GalleryGrid({ images }: { images: GalleryItem[] }) {
  const [filter, setFilter] = useState<string>("ALL");

  const filtered =
    filter === "ALL"
      ? images
      : images.filter((img) => img.category === filter);

  return (
    <>
      <FilterPills
        options={[...CATEGORIES]}
        active={filter}
        onChange={setFilter}
      />

      {filtered.length === 0 ? (
        <p className="text-center text-zinc-400">No photos in this category.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((image) => (
            <div
              key={image.id}
              className="group overflow-hidden border border-white/10 bg-jackals-surface"
            >
              <ProductPlaceholder className="aspect-[4/3] transition-transform group-hover:scale-[1.02]" />
              <div className="p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white">{image.title}</h3>
                  <Badge>{image.category}</Badge>
                </div>
                {image.description && (
                  <p className="text-sm text-zinc-400">{image.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
