"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import {
  GALLERY_ACCEPTED_IMAGE_TYPES,
  GALLERY_MAX_UPLOAD_BYTES,
} from "@/lib/gallery-upload-config";
import { apiDelete, apiPostForm } from "@/lib/client-api";
import { normalizeAchievementUrl } from "@/lib/public-paths";
import { cn } from "@/lib/utils";

export function AchievementImageField({
  imageUrl,
  onChange,
  disabled = false,
}: {
  imageUrl: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const displayUrl = localPreview ?? (imageUrl ? normalizeAchievementUrl(imageUrl) : null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files can be uploaded.");
      return;
    }

    if (file.size > GALLERY_MAX_UPLOAD_BYTES) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return preview;
    });
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    if (imageUrl) {
      formData.append("previousUrl", imageUrl);
    }

    const result = await apiPostForm<{ imageUrl: string }>(
      "/api/admin/achievements/upload",
      formData,
      "Image upload failed.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      setLocalPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }

    setLocalPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    onChange(result.data.imageUrl);
  };

  const handleFiles = (files: FileList | File[]) => {
    const file = [...files][0];
    if (file) void uploadFile(file);
  };

  const removeImage = async () => {
    if (!imageUrl) return;
    if (!confirm("Remove this achievement image?")) return;

    setLoading(true);
    setError(null);

    const result = await apiDelete(
      `/api/admin/achievements/upload?imageUrl=${encodeURIComponent(imageUrl)}`,
      "Failed to remove image.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onChange("");
  };

  const isDisabled = disabled || loading;

  return (
    <div className="sm:col-span-2">
      <Label>Achievement image (optional)</Label>
      <p className="mt-1 text-xs text-zinc-500">
        JPEG, PNG, WebP, or GIF up to 5 MB. Landscape photos work best.
      </p>

      {displayUrl ? (
        <div className="mt-3 overflow-hidden rounded-sm border border-white/10 bg-black">
          <div className="relative aspect-[16/10] w-full">
            <Image
              src={displayUrl}
              alt="Achievement preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-white/10 bg-jackals-inset/40 p-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isDisabled}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Replace image
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isDisabled}
              onClick={() => void removeImage()}
              className="text-zinc-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "mt-3 rounded-sm border border-dashed p-8 text-center transition-colors",
            dragging
              ? "border-jackals-red/60 bg-jackals-red/5"
              : "border-white/15 bg-jackals-inset/40",
            isDisabled && "pointer-events-none opacity-60",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (event.dataTransfer.files.length > 0) {
              handleFiles(event.dataTransfer.files);
            }
          }}
        >
          {loading ? (
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-jackals-red-light" />
          ) : (
            <ImagePlus className="mx-auto h-10 w-10 text-jackals-red-light/70" />
          )}
          <p className="mt-4 text-sm text-zinc-300">
            Drop a trophy or team photo here
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-4"
            disabled={isDisabled}
            onClick={() => inputRef.current?.click()}
          >
            Browse images
          </Button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={GALLERY_ACCEPTED_IMAGE_TYPES}
        className="hidden"
        disabled={isDisabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFiles([file]);
          event.target.value = "";
        }}
      />

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
