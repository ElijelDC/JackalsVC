"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import {
  GALLERY_ACCEPTED_IMAGE_TYPES,
  GALLERY_MAX_BULK_FILES,
  GALLERY_MAX_UPLOAD_BYTES,
} from "@/lib/gallery-upload-config";
import { apiPostForm } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type UploadResponse = {
  uploaded: number;
  errors?: string[];
};

type PreviewFile = {
  id: string;
  file: File;
  previewUrl: string;
  tooLarge: boolean;
};

export function GalleryBulkUpload({
  albumId,
  onUploaded,
}: {
  albumId: string;
  onUploaded: () => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      for (const entry of files) {
        URL.revokeObjectURL(entry.previewUrl);
      }
    };
  }, [files]);

  const addFiles = (incoming: FileList | File[]) => {
    const images = [...incoming].filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) {
      setError("Only image files can be uploaded.");
      return;
    }

    setFiles((current) => {
      const merged = [...current];
      for (const file of images) {
        if (merged.length >= GALLERY_MAX_BULK_FILES) break;
        merged.push({
          id: `${file.name}-${file.lastModified}-${file.size}`,
          file,
          previewUrl: URL.createObjectURL(file),
          tooLarge: file.size > GALLERY_MAX_UPLOAD_BYTES,
        });
      }
      return merged;
    });
    setError(null);
    setMessage(null);
  };

  const removeFile = (id: string) => {
    setFiles((current) => {
      const target = current.find((entry) => entry.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((entry) => entry.id !== id);
    });
  };

  const clearFiles = () => {
    for (const entry of files) {
      URL.revokeObjectURL(entry.previewUrl);
    }
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    const validFiles = files.filter((entry) => !entry.tooLarge);
    if (validFiles.length === 0) {
      setError(
        files.some((entry) => entry.tooLarge)
          ? "Remove oversized files before uploading."
          : "Choose one or more images first.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    for (const entry of validFiles) {
      formData.append("files", entry.file);
    }

    const result = await apiPostForm<UploadResponse>(
      `/api/admin/gallery/${albumId}/photos/upload`,
      formData,
      "Upload failed. Please try again.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const warnings =
      result.data.errors && result.data.errors.length > 0
        ? ` Some files were skipped: ${result.data.errors.join(" ")}`
        : "";

    setMessage(
      `${result.data.uploaded} photo${result.data.uploaded === 1 ? "" : "s"} uploaded.${warnings}`,
    );
    clearFiles();
    await onUploaded();
  };

  const totalSizeMb = (
    files.reduce((sum, entry) => sum + entry.file.size, 0) / (1024 * 1024)
  ).toFixed(1);
  const hasOversized = files.some((entry) => entry.tooLarge);

  return (
    <Card className="mb-8">
      <h3 className="font-display mb-2 text-lg font-semibold text-white">
        Upload photos
      </h3>
      <p className="mb-4 text-sm text-zinc-400">
        Drag images here or browse your device. Up to {GALLERY_MAX_BULK_FILES} files
        per batch, 15 MB each.
      </p>

      <SuccessBanner message={message} />

      <div
        className={cn(
          "relative rounded-sm border border-dashed p-8 text-center transition-colors",
          dragging
            ? "border-jackals-red/60 bg-jackals-red/5"
            : "border-white/15 bg-jackals-inset/40",
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
            addFiles(event.dataTransfer.files);
          }
        }}
      >
        <ImagePlus className="mx-auto h-10 w-10 text-jackals-red-light/70" />
        <p className="mt-4 text-sm text-zinc-300">
          Drop your match, training, or event photos here
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={GALLERY_ACCEPTED_IMAGE_TYPES}
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
        >
          Browse images
        </Button>
      </div>

      {files.length > 0 && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-zinc-400">
              {files.length} selected · {totalSizeMb} MB total
              {hasOversized && (
                <span className="ml-2 text-red-400">Some files exceed 15 MB</span>
              )}
            </p>
            <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={clearFiles}>
              Clear all
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {files.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "relative overflow-hidden rounded-sm border",
                  entry.tooLarge ? "border-red-500/50" : "border-white/10",
                )}
              >
                <div className="relative aspect-square">
                  <Image
                    src={entry.previewUrl}
                    alt={entry.file.name}
                    fill
                    sizes="120px"
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white transition-colors hover:bg-black"
                    onClick={() => removeFile(entry.id)}
                    aria-label={`Remove ${entry.file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="truncate px-2 py-1.5 text-xs text-zinc-400">{entry.file.name}</p>
              </div>
            ))}
          </div>

          <Button type="button" disabled={loading || hasOversized} onClick={handleUpload}>
            <Upload className="h-4 w-4" />
            {loading ? "Uploading..." : `Upload ${files.length} photo${files.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      )}

      <FormError message={error} />
    </Card>
  );
}
