"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import {
  GALLERY_ACCEPTED_IMAGE_TYPES,
  GALLERY_CLIENT_COMPRESS_CONCURRENCY,
  GALLERY_MAX_BULK_FILES,
  GALLERY_MAX_PREVIEW_THUMBS,
  GALLERY_MAX_SELECTION,
  GALLERY_MAX_UPLOAD_BYTES,
  GALLERY_UPLOAD_BATCH_DELAY_MS,
} from "@/lib/gallery-upload-config";
import {
  compressImageFileForUpload,
  mapWithConcurrency,
} from "@/lib/client-image-compress";
import { isAcceptedImageFile } from "@/lib/image-upload-types";
import { apiPostForm } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type UploadResponse = {
  uploaded: number;
  errors?: string[];
  coverImageUrl?: string;
};

type PreviewFile = {
  id: string;
  file: File;
  previewUrl: string | null;
  tooLarge: boolean;
};

function chunkFiles<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function revokePreview(entry: PreviewFile) {
  if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
}

export function GalleryBulkUpload({
  albumId,
  onUploaded,
}: {
  albumId: string;
  onUploaded: (result?: UploadResponse) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<PreviewFile[]>([]);
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  filesRef.current = files;

  useEffect(() => {
    return () => {
      for (const entry of filesRef.current) {
        revokePreview(entry);
      }
    };
  }, []);

  const addFiles = (incoming: FileList | File[]) => {
    const images = [...incoming].filter((file) => isAcceptedImageFile(file));
    if (images.length === 0) {
      setError("Only image files can be uploaded.");
      return;
    }

    let skipped = 0;
    setFiles((current) => {
      const merged = [...current];
      for (const file of images) {
        if (merged.length >= GALLERY_MAX_SELECTION) {
          skipped += 1;
          continue;
        }
        const previewUrl =
          merged.length < GALLERY_MAX_PREVIEW_THUMBS
            ? URL.createObjectURL(file)
            : null;
        merged.push({
          id: `${file.name}-${file.lastModified}-${file.size}-${merged.length}`,
          file,
          previewUrl,
          tooLarge: file.size > GALLERY_MAX_UPLOAD_BYTES,
        });
      }
      return merged;
    });
    if (skipped > 0) {
      setError(`Only ${GALLERY_MAX_SELECTION} images can be uploaded at once.`);
    } else {
      setError(null);
    }
    setMessage(null);
  };

  const removeFile = (id: string) => {
    setFiles((current) => {
      const target = current.find((entry) => entry.id === id);
      if (target) revokePreview(target);
      return current.filter((entry) => entry.id !== id);
    });
  };

  const clearFiles = () => {
    for (const entry of files) {
      revokePreview(entry);
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
    setUploadProgress(
      `Preparing ${validFiles.length} photo${validFiles.length === 1 ? "" : "s"}…`,
    );

    let prepared: File[];
    try {
      prepared = await mapWithConcurrency(
        validFiles,
        GALLERY_CLIENT_COMPRESS_CONCURRENCY,
        async (entry) => compressImageFileForUpload(entry.file, "gallery"),
        (completed, total) => {
          setUploadProgress(`Compressing ${completed} of ${total}…`);
        },
      );
    } catch {
      setLoading(false);
      setUploadProgress(null);
      setError("Could not prepare images for upload. Please try again.");
      return;
    }

    const batches = chunkFiles(prepared, GALLERY_MAX_BULK_FILES);
    let uploadedTotal = 0;
    const warnings: string[] = [];
    let latestCoverImageUrl: string | undefined;

    for (let index = 0; index < batches.length; index += 1) {
      const batch = batches[index]!;
      setUploadProgress(
        `Uploading ${Math.min(uploadedTotal + batch.length, prepared.length)} of ${prepared.length}… (batch ${index + 1}/${batches.length})`,
      );

      const formData = new FormData();
      for (const file of batch) {
        formData.append("files", file);
      }

      const result = await apiPostForm<UploadResponse>(
        `/api/admin/gallery/${albumId}/photos/upload`,
        formData,
        "Upload failed. Please try again.",
      );

      if (!result.ok) {
        setLoading(false);
        setUploadProgress(null);
        setError(
          uploadedTotal > 0
            ? `${result.error} (${uploadedTotal} photo${uploadedTotal === 1 ? "" : "s"} uploaded before the error.)`
            : result.error,
        );
        return;
      }

      uploadedTotal += result.data.uploaded;
      if (result.data.coverImageUrl) {
        latestCoverImageUrl = result.data.coverImageUrl;
      }
      if (result.data.errors?.length) {
        warnings.push(...result.data.errors);
      }

      if (index < batches.length - 1) {
        await wait(GALLERY_UPLOAD_BATCH_DELAY_MS);
      }
    }

    setLoading(false);
    setUploadProgress(null);

    const warningText =
      warnings.length > 0
        ? ` Some files were skipped: ${warnings.join(" ")}`
        : "";

    setMessage(
      `${uploadedTotal} photo${uploadedTotal === 1 ? "" : "s"} uploaded.${warningText}`,
    );
    clearFiles();
    await onUploaded({
      uploaded: uploadedTotal,
      errors: warnings.length > 0 ? warnings : undefined,
      coverImageUrl: latestCoverImageUrl,
    });
  };

  const totalSizeMb = (
    files.reduce((sum, entry) => sum + entry.file.size, 0) / (1024 * 1024)
  ).toFixed(1);
  const hasOversized = files.some((entry) => entry.tooLarge);
  const previewEntries = files.filter((entry) => entry.previewUrl);
  const hiddenCount = files.length - previewEntries.length;
  const uploadCount = files.filter((entry) => !entry.tooLarge).length;

  return (
    <Card className="mb-8">
      <h3 className="font-display mb-2 text-lg font-semibold text-white">
        Upload photos
      </h3>
      <p className="mb-4 text-sm text-zinc-400">
        Drag images here or browse your device. Up to {GALLERY_MAX_SELECTION}{" "}
        images per session — compressed in your browser first, then sent in
        batches of {GALLERY_MAX_BULK_FILES} (15 MB max per original).
      </p>

      <SuccessBanner message={message} />
      {uploadProgress && (
        <p className="mb-4 text-sm text-zinc-400">{uploadProgress}</p>
      )}

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

          {previewEntries.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {previewEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "relative overflow-hidden rounded-sm border",
                    entry.tooLarge ? "border-red-500/50" : "border-white/10",
                  )}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={entry.previewUrl!}
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
                  <p className="truncate px-2 py-1.5 text-xs text-zinc-400">
                    {entry.file.name}
                  </p>
                </div>
              ))}
            </div>
          )}

          {hiddenCount > 0 && (
            <p className="text-sm text-zinc-500">
              +{hiddenCount} more image{hiddenCount === 1 ? "" : "s"} queued
              (previews limited to keep the page responsive). Clear all to
              remove them, or upload as-is.
            </p>
          )}

          <Button type="button" disabled={loading || hasOversized} onClick={() => void handleUpload()}>
            <Upload className="h-4 w-4" />
            {loading
              ? "Uploading..."
              : `Upload ${uploadCount} photo${uploadCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      )}

      <FormError message={error} />
    </Card>
  );
}
