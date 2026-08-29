"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiPatch, apiPostForm } from "@/lib/client-api";
import { GALLERY_ACCEPTED_IMAGE_TYPES } from "@/lib/gallery-upload-config";
import { isMissingVlyNumber } from "@/lib/vly-number";

type ProfileMatchdayFields = {
  id: string;
  vlyNumber: string | null;
  vlyMembershipPhotoUrl: string | null;
  playerNumber: number | null;
};

export function ProfileMatchdaySection({
  initialVlyNumber,
  initialVlyPhotoUrl,
  initialPlayerNumber,
  isCoach = false,
}: {
  initialVlyNumber: string | null;
  initialVlyPhotoUrl: string | null;
  initialPlayerNumber: number | null;
  isCoach?: boolean;
}) {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [vlyNumber, setVlyNumber] = useState(initialVlyNumber);
  const [vlyDraft, setVlyDraft] = useState(initialVlyNumber ?? "");
  const [isEditingVly, setIsEditingVly] = useState(
    isMissingVlyNumber(initialVlyNumber),
  );
  const [vlyLoading, setVlyLoading] = useState(false);
  const [vlyError, setVlyError] = useState<string | null>(null);
  const [vlySaved, setVlySaved] = useState(false);
  const hasVlyNumber = !isMissingVlyNumber(vlyNumber);

  const [photoUrl, setPhotoUrl] = useState(initialVlyPhotoUrl);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoSaved, setPhotoSaved] = useState(false);

  const [baselinePlayerNumber, setBaselinePlayerNumber] = useState(
    initialPlayerNumber,
  );
  const [playerNumber, setPlayerNumber] = useState(
    initialPlayerNumber?.toString() ?? "",
  );
  const [isEditingNumber, setIsEditingNumber] = useState(
    initialPlayerNumber == null,
  );
  const [numberLoading, setNumberLoading] = useState(false);
  const [numberError, setNumberError] = useState<string | null>(null);
  const [numberNotice, setNumberNotice] = useState<string | null>(null);
  const [numberSaved, setNumberSaved] = useState(false);

  const hasPlayerNumber = baselinePlayerNumber != null;
  const numberLabel = isCoach ? "VLYC coach number" : "VLY number";
  const numberPlaceholder = isCoach ? "VLYC12345" : "VLY12345";

  const cancelVlyEdit = () => {
    setVlyDraft(vlyNumber ?? "");
    setVlyError(null);
    setVlySaved(false);
    setIsEditingVly(!hasVlyNumber);
  };

  const saveVlyNumber = async () => {
    setVlyError(null);
    setVlySaved(false);
    const trimmed = vlyDraft.trim();
    if (!trimmed) {
      setVlyError(`Enter your ${numberLabel}.`);
      return;
    }

    if (trimmed.toUpperCase() === (vlyNumber ?? "").toUpperCase()) {
      setVlySaved(true);
      setIsEditingVly(false);
      return;
    }

    setVlyLoading(true);
    const result = await apiPatch<ProfileMatchdayFields>(
      "/api/profile",
      { vlyNumber: trimmed },
      `Failed to save ${numberLabel}.`,
    );
    setVlyLoading(false);

    if (!result.ok) {
      setVlyError(result.error);
      return;
    }

    setVlyNumber(result.data.vlyNumber);
    setVlyDraft(result.data.vlyNumber ?? "");
    setVlySaved(true);
    setIsEditingVly(false);
    router.refresh();
  };

  const uploadVlyPhoto = async (file: File | null) => {
    if (!file) return;
    setPhotoError(null);
    setPhotoSaved(false);
    setPhotoLoading(true);

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

    setPhotoUrl(result.data.vlyMembershipPhotoUrl);
    setPhotoSaved(true);
  };

  const cancelPlayerNumberEdit = () => {
    setPlayerNumber(
      baselinePlayerNumber != null ? String(baselinePlayerNumber) : "",
    );
    setNumberError(null);
    setNumberNotice(null);
    setNumberSaved(false);
    setIsEditingNumber(!hasPlayerNumber);
  };

  const baselinePlayerNumberText =
    baselinePlayerNumber != null ? String(baselinePlayerNumber) : "";

  const savePlayerNumber = async () => {
    setNumberError(null);
    setNumberNotice(null);
    setNumberSaved(false);

    const trimmed = playerNumber.trim();

    if (trimmed === baselinePlayerNumberText) {
      setNumberNotice(
        hasPlayerNumber
          ? "That number is already saved."
          : "Enter a player number before saving.",
      );
      return;
    }

    const parsed = trimmed === "" ? null : Number.parseInt(trimmed, 10);

    if (
      trimmed !== "" &&
      (parsed === null || Number.isNaN(parsed) || parsed < 1 || parsed > 99)
    ) {
      setNumberError("Enter a number between 1 and 99, or leave blank.");
      return;
    }

    setNumberLoading(true);

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
    setBaselinePlayerNumber(result.data.playerNumber);
    setNumberSaved(true);
    setIsEditingNumber(result.data.playerNumber == null);
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-8">
      <h2 className="font-display text-lg font-semibold text-white">
        Club membership details
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        {isCoach
          ? "Add or update your VLYC number and membership card photo anytime. Coaches do not use in-game player numbers."
          : "Add or update your VLY number and membership card photo anytime. Set your in-game player number for matchday sheets."}
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {numberLabel}
          </p>

          {!isEditingVly && hasVlyNumber ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="font-mono text-base text-jackals-red-light">
                {vlyNumber}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditingVly(true);
                  setVlySaved(false);
                  setVlyError(null);
                }}
              >
                Edit
              </Button>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={vlyDraft}
                onChange={(event) => {
                  setVlyDraft(event.target.value.toUpperCase());
                  setVlySaved(false);
                  setVlyError(null);
                }}
                placeholder={numberPlaceholder}
                className="w-40 rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-white placeholder:text-zinc-600 focus:border-jackals-red/40 focus:outline-none focus:ring-2 focus:ring-jackals-red/20"
                autoCapitalize="characters"
                spellCheck={false}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => void saveVlyNumber()}
                disabled={vlyLoading}
              >
                {vlyLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Saving
                  </>
                ) : (
                  "Save number"
                )}
              </Button>
              {hasVlyNumber && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={cancelVlyEdit}
                  disabled={vlyLoading}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}

          {!hasVlyNumber && (
            <p className="mt-2 text-xs text-zinc-500">
              Leave this until you receive your number — you can add or change it
              here anytime.
            </p>
          )}
          {vlySaved && (
            <p className="mt-2 text-sm text-green-400">{numberLabel} saved.</p>
          )}
          {vlyError && (
            <p className="mt-2 text-sm text-red-400">{vlyError}</p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            VLY membership photo
          </p>
          <div className="mt-3 flex items-start gap-4">
            <div className="relative shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
              <div className="flex h-36 w-28 items-center justify-center">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
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
            </div>

            <div className="min-w-0 space-y-3 text-sm text-zinc-400">
              <p>
                Upload a clear photo of your VLY membership card. You can replace
                it later if needed.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={photoLoading}
                onClick={() => photoInputRef.current?.click()}
              >
                {photoLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Uploading
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" aria-hidden />
                    {photoUrl ? "Replace photo" : "Upload photo"}
                  </>
                )}
              </Button>
              <input
                ref={photoInputRef}
                type="file"
                accept={GALLERY_ACCEPTED_IMAGE_TYPES}
                className="hidden"
                onChange={(event) => {
                  void uploadVlyPhoto(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
              {photoSaved && (
                <p className="text-sm text-green-400">Photo saved.</p>
              )}
              {photoError && (
                <p className="text-sm text-red-400">{photoError}</p>
              )}
            </div>
          </div>
        </div>

        {!isCoach && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              In-game player number
            </p>

            {!isEditingNumber && hasPlayerNumber ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <p className="text-lg font-semibold text-white">
                  {baselinePlayerNumber}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditingNumber(true);
                    setNumberSaved(false);
                    setNumberError(null);
                    setNumberNotice(null);
                  }}
                >
                  Edit
                </Button>
              </div>
            ) : (
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
                    setNumberNotice(null);
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
                {hasPlayerNumber && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={cancelPlayerNumberEdit}
                    disabled={numberLoading}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}

            {numberSaved && (
              <p className="mt-2 text-sm text-green-400">Player number saved.</p>
            )}
            {numberNotice && (
              <p className="mt-2 text-sm text-zinc-400">{numberNotice}</p>
            )}
            {numberError && (
              <p className="mt-2 text-sm text-red-400">{numberError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
