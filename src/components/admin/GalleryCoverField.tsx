"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormMessage";
import { GALLERY_ACCEPTED_IMAGE_TYPES } from "@/lib/gallery-upload-config";
import { isGalleryPlaceholderCover } from "@/lib/gallery-config";
import { cn } from "@/lib/utils";

export function GalleryCoverField({
  coverImageUrl,
  onCoverChange,
  onUpload,
  uploading = false,
}: {
  coverImageUrl: string;
  onCoverChange: (url: string) => void;
  onUpload: (file: File) => Promise<void>;
  uploading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const showPlaceholder = isGalleryPlaceholderCover(coverImageUrl);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      await onUpload(file);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Cover upload failed.",
      );
    }
  };

  return (
    <div>
      <Label>Cover image</Label>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={cn(
            "relative h-36 w-full max-w-xs overflow-hidden rounded-sm border bg-jackals-inset/50 sm:h-32 sm:w-48",
            showPlaceholder ? "border-dashed border-white/20" : "border-white/10",
          )}
        >
          {showPlaceholder ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <ImagePlus className="h-8 w-8 text-zinc-600" />
              <p className="text-xs text-zinc-500">
                Upload a cover, or add photos below and we&apos;ll use the first one.
              </p>
            </div>
          ) : (
            <Image
              src={coverImageUrl}
              alt="Album cover preview"
              fill
              sizes="192px"
              className="object-cover"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? "Uploading..." : "Upload cover"}
            </Button>
            {!showPlaceholder && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => onCoverChange("")}
              >
                Clear
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={GALLERY_ACCEPTED_IMAGE_TYPES}
            className="hidden"
            onChange={(event) => {
              void handleFile(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
          <p className="text-xs text-zinc-500">
            JPEG, PNG, WebP, or GIF up to 15 MB. Optional when creating a new album.
          </p>
          <FormError message={error} />
        </div>
      </div>
    </div>
  );
}
