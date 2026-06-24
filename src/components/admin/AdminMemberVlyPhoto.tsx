"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { GALLERY_ACCEPTED_IMAGE_TYPES } from "@/lib/gallery-upload-config";
import { apiPostForm } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export function AdminMemberVlyPhoto({
  memberId,
  name,
  imageUrl,
  disabled = false,
  onUpdated,
}: {
  memberId: string;
  name: string;
  imageUrl: string | null;
  disabled?: boolean;
  onUpdated: () => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File | null) => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await apiPostForm(
      `/api/admin/club-members/${memberId}/vly-photo`,
      formData,
      "VLY photo upload failed.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    await onUpdated();
  };

  const isDisabled = disabled || loading;

  return (
    <div className="w-35 shrink-0 md:w-28">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500 md:mb-0.5">
        VLY photo
      </p>
      <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/20">
        <div className="flex h-28 w-20 items-center justify-center md:h-24 md:w-16">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`VLY membership photo for ${name}`}
              width={80}
              height={112}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="px-2 text-center text-[10px] text-zinc-500">
              No VLY photo
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={isDisabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-white/15 px-2 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:border-white/30 hover:text-white md:mt-1 md:py-1 md:text-[10px]",
          isDisabled && "cursor-not-allowed opacity-60",
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading
          </>
        ) : (
          <>
            <Upload className="h-3.5 w-3.5" />
            Replace photo
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={GALLERY_ACCEPTED_IMAGE_TYPES}
        className="hidden"
        onChange={(event) => {
          void uploadImage(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />

      {error && (
        <p className="mt-1 text-[10px] leading-tight text-red-400">{error}</p>
      )}
    </div>
  );
}
