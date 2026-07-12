"use client";

import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type GalleryPhoto = {
  id: string;
  title: string | null;
  caption: string | null;
  imageUrl: string;
  sortOrder: number;
};

export function GalleryPhotoGrid({
  photos,
  editingPhotoId,
  deletingPhotoId,
  onEdit,
  onDelete,
}: {
  photos: GalleryPhoto[];
  editingPhotoId: string | null;
  deletingPhotoId: string | null;
  onEdit: (photo: GalleryPhoto) => void;
  onDelete: (photoId: string) => void;
}) {
  if (photos.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-white/15 bg-jackals-inset/30 px-6 py-12 text-center">
        <p className="text-sm text-zinc-400">No photos yet.</p>
        <p className="mt-1 text-xs text-zinc-500">
          Drag images into the upload area above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo) => {
        const label = photo.title ?? photo.caption ?? "Untitled photo";
        const isEditing = editingPhotoId === photo.id;

        return (
          <article
            key={photo.id}
            className={cn(
              "group relative overflow-hidden rounded-sm border bg-jackals-inset/50",
              isEditing
                ? "border-jackals-red/60 ring-1 ring-jackals-red/40"
                : "border-white/10",
            )}
          >
            <div className="relative aspect-square">
              <Image
                src={photo.imageUrl}
                alt={label}
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 flex gap-2 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 bg-black/40 text-xs"
                  onClick={() => onEdit(photo)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 bg-black/40 text-xs text-red-300 hover:text-red-200"
                  disabled={deletingPhotoId === photo.id}
                  onClick={() => onDelete(photo.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="border-t border-white/10 px-2 py-2">
              <p className="truncate text-xs font-medium text-zinc-300">{label}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
