"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { MemberAvatar } from "@/components/member/MemberAvatar";
import { GALLERY_ACCEPTED_IMAGE_TYPES } from "@/lib/gallery-upload-config";
import { apiDelete, apiPostForm } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export function AdminMemberProfileImage({
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
      `/api/admin/club-members/${memberId}/profile-image`,
      formData,
      "Profile image upload failed.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    await onUpdated();
  };

  const removeImage = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!imageUrl || !confirm("Remove this member's profile photo?")) return;

    setLoading(true);
    setError(null);

    const result = await apiDelete(
      `/api/admin/club-members/${memberId}/profile-image`,
      "Failed to remove profile image.",
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
    <div className="shrink-0">
      <div className="relative">
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "group relative rounded-full focus-visible:outline focus-visible:ring-2 focus-visible:ring-jackals-red/60 focus-visible:ring-offset-2 focus-visible:ring-offset-jackals-surface",
            isDisabled && "cursor-not-allowed opacity-60",
          )}
          aria-label={imageUrl ? `Change photo for ${name}` : `Add photo for ${name}`}
          title={imageUrl ? "Change photo" : "Add photo"}
        >
          <MemberAvatar
            name={name}
            imageUrl={imageUrl}
            size="md"
            className="h-14 w-14 text-base ring-2 ring-white/10 transition-all group-hover:ring-jackals-red/40"
          />
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-full bg-black/55 transition-opacity",
              loading
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden />
            ) : (
              <Camera className="h-4 w-4 text-white" aria-hidden />
            )}
          </span>
        </button>

        {imageUrl && !loading && (
          <button
            type="button"
            disabled={isDisabled}
            onClick={(event) => void removeImage(event)}
            className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-jackals-surface text-zinc-400 shadow-sm transition-colors hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-300 focus-visible:outline focus-visible:ring-2 focus-visible:ring-jackals-red/60 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Remove photo for ${name}`}
            title="Remove photo"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

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
        <p className="mt-1.5 max-w-[5.5rem] text-center text-[10px] leading-tight text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
