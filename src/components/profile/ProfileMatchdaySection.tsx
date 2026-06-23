"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GALLERY_ACCEPTED_IMAGE_TYPES } from "@/lib/gallery-upload-config";
import { apiDelete, apiPatch, apiPostForm } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type ProfileMatchdayFields = {
  id: string;
  vlyMembershipPhotoUrl: string | null;
  playerNumber: number | null;
};

export function ProfileMatchdaySection({
  initialVlyPhotoUrl,
  initialPlayerNumber,
  isCoach = false,
}: {
  initialVlyPhotoUrl: string | null;
  initialPlayerNumber: number | null;
  isCoach?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [vlyPhotoUrl, setVlyPhotoUrl] = useState(initialVlyPhotoUrl);
  const [playerNumber, setPlayerNumber] = useState(
    initialPlayerNumber?.toString() ?? "",
  );
  const [photoLoading, setPhotoLoading] = useState(false);
  const [numberLoading, setNumberLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [numberError, setNumberError] = useState<string | null>(null);
  const [numberSaved, setNumberSaved] = useState(false);

  const uploadPhoto = async (file: File | null) => {
    if (!file) return;

    setPhotoLoading(true);
    setPhotoError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await apiPostForm<ProfileMatchdayFields>(
      "/api/profile/vly-membership-photo",
      formData,
      "VLY photo upload failed.",
    );

    setPhotoLoading(false);

    if (!result.ok) {
      setPhotoError(result.error);
      return;
    }

    setVlyPhotoUrl(result.data.vlyMembershipPhotoUrl);
  };

  const removePhoto = async () => {
    if (!vlyPhotoUrl || !confirm("Remove your VLY membership photo?")) return;

    setPhotoLoading(true);
    setPhotoError(null);

    const result = await apiDelete(
      "/api/profile/vly-membership-photo",
      "Failed to remove VLY photo.",
    );

    setPhotoLoading(false);

    if (!result.ok) {
      setPhotoError(result.error);
      return;
    }

    setVlyPhotoUrl(null);
  };

  const savePlayerNumber = async () => {
    setNumberLoading(true);
    setNumberError(null);
    setNumberSaved(false);

    const trimmed = playerNumber.trim();
    const parsed = trimmed === "" ? null : Number.parseInt(trimmed, 10);

    if (
      trimmed !== "" &&
      (parsed === null || Number.isNaN(parsed) || parsed < 1 || parsed > 99)
    ) {
      setNumberLoading(false);
      setNumberError("Enter a number between 1 and 99, or leave blank.");
      return;
    }

    const result = await apiPatch<ProfileMatchdayFields>(
      "/api/profile",
      { playerNumber: parsed },
      "Failed to save player number.",
    );

    setNumberLoading(false);

    if (!result.ok) {
      setNumberError(result.error);
      return;
    }

    setPlayerNumber(
      result.data.playerNumber != null ? String(result.data.playerNumber) : "",
    );
    setNumberSaved(true);
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-8">
      <h2 className="font-display text-lg font-semibold text-white">
        Matchday details
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        {isCoach
          ? "Upload your VLY membership card photo. Coaches are listed as Coach on matchday sheets for referees."
          : "Upload your VLY membership card photo and set your in-game player number. Coaches use these on matchday sheets for referees."}
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            VLY membership photo
          </p>
          <div className="mt-3 flex items-start gap-4">
            <div className="relative shrink-0">
              <button
                type="button"
                disabled={photoLoading}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "group relative overflow-hidden rounded-lg border border-white/10 bg-black/20 focus-visible:outline focus-visible:ring-2 focus-visible:ring-jackals-red/60",
                  photoLoading && "cursor-not-allowed opacity-60",
                )}
                aria-label={
                  vlyPhotoUrl
                    ? "Change VLY membership photo"
                    : "Upload VLY membership photo"
                }
              >
                <div className="flex h-36 w-28 items-center justify-center">
                  {vlyPhotoUrl ? (
                    <Image
                      src={vlyPhotoUrl}
                      alt="VLY membership photo"
                      width={112}
                      height={144}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="px-3 text-center text-xs text-zinc-500">
                      No photo yet
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/55 transition-opacity",
                    photoLoading
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                  )}
                >
                  {photoLoading ? (
                    <Loader2
                      className="h-5 w-5 animate-spin text-white"
                      aria-hidden
                    />
                  ) : (
                    <Camera className="h-5 w-5 text-white" aria-hidden />
                  )}
                </span>
              </button>

              {vlyPhotoUrl && !photoLoading && (
                <button
                  type="button"
                  onClick={() => void removePhoto()}
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-jackals-surface text-zinc-400 shadow-sm transition-colors hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-300"
                  aria-label="Remove VLY membership photo"
                  title="Remove photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="min-w-0 text-sm text-zinc-400">
              <p>Use a clear screenshot or photo of your VLY membership card.</p>
              <p className="mt-2">JPEG, PNG, WebP, or GIF up to 5 MB.</p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={GALLERY_ACCEPTED_IMAGE_TYPES}
            className="hidden"
            onChange={(event) => {
              void uploadPhoto(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
          {photoError && (
            <p className="mt-2 text-sm text-red-400">{photoError}</p>
          )}
        </div>

        {!isCoach && (
        <div>
          <label
            htmlFor="player-number"
            className="text-xs font-medium uppercase tracking-wide text-zinc-500"
          >
            In-game player number
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              id="player-number"
              type="number"
              min={1}
              max={99}
              inputMode="numeric"
              placeholder="e.g. 7"
              value={playerNumber}
              onChange={(event) => {
                setPlayerNumber(event.target.value);
                setNumberSaved(false);
                setNumberError(null);
              }}
              className="w-24 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-white placeholder:text-zinc-600 focus:border-jackals-red/40 focus:outline-none focus:ring-2 focus:ring-jackals-red/20"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => void savePlayerNumber()}
              disabled={numberLoading}
            >
              {numberLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving
                </>
              ) : (
                "Save number"
              )}
            </Button>
            {numberSaved && (
              <span className="text-sm text-green-400">Saved</span>
            )}
          </div>
          {numberError && (
            <p className="mt-2 text-sm text-red-400">{numberError}</p>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
