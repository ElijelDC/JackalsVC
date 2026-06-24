"use client";

import Image from "next/image";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiPatch } from "@/lib/client-api";

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
        Matchday details
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        {isCoach
          ? "Your VLY membership card photo is set during registration and managed by admins."
          : "Your VLY membership card photo is set during registration and managed by admins. Set your in-game player number below for matchday sheets."}
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            VLY membership photo
          </p>
          <div className="mt-3 flex items-start gap-4">
            <div className="relative shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
              <div className="flex h-36 w-28 items-center justify-center">
                {initialVlyPhotoUrl ? (
                  <Image
                    src={initialVlyPhotoUrl}
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

            <div className="min-w-0 text-sm text-zinc-400">
              <p>
                Submitted when you registered. Contact an admin or coach if this
                needs updating.
              </p>
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
