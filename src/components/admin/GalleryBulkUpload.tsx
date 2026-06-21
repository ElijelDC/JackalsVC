"use client";

import { useRef, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
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

export function GalleryBulkUpload({
  albumId,
  onUploaded,
}: {
  albumId: string;
  onUploaded: () => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const addFiles = (incoming: FileList | File[]) => {
    const next = [...incoming].filter((file) => file.type.startsWith("image/"));
    if (next.length === 0) {
      setError("Only image files can be uploaded.");
      return;
    }
    setFiles((current) => {
      const merged = [...current];
      for (const file of next) {
        if (merged.length >= GALLERY_MAX_BULK_FILES) break;
        merged.push(file);
      }
      return merged;
    });
    setError(null);
    setMessage(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Choose one or more images first.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
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
    setFiles([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    await onUploaded();
  };

  const totalSizeMb = (
    files.reduce((sum, file) => sum + file.size, 0) /
    (1024 * 1024)
  ).toFixed(1);

  return (
    <Card className="mb-8">
      <h3 className="font-display mb-2 text-lg font-semibold text-white">
        Bulk upload photos
      </h3>
      <p className="mb-4 text-sm text-zinc-400">
        Upload multiple images at once into this album. JPEG, PNG, WebP, or GIF
        up to 5 MB each (max {GALLERY_MAX_BULK_FILES} files per batch).
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
          Drag and drop images here, or choose files from your device.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={GALLERY_ACCEPTED_IMAGE_TYPES}
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) {
              addFiles(event.target.files);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
        >
          Choose images
        </Button>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-zinc-400">
            {files.length} file{files.length === 1 ? "" : "s"} selected ·{" "}
            {totalSizeMb} MB total
          </p>
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-sm border border-white/10 bg-jackals-inset/50 p-3 text-sm text-zinc-300">
            {files.map((file) => (
              <li key={`${file.name}-${file.lastModified}`} className="truncate">
                {file.name}
                {file.size > GALLERY_MAX_UPLOAD_BYTES && (
                  <span className="ml-2 text-red-400">(too large)</span>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={loading} onClick={handleUpload}>
              <Upload className="h-4 w-4" />
              {loading ? "Uploading..." : "Upload to album"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={loading}
              onClick={() => {
                setFiles([]);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              Clear selection
            </Button>
          </div>
        </div>
      )}

      <FormError message={error} />
    </Card>
  );
}
