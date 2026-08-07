"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import {
  COACH_POLO_MATERIALS,
  type CoachPoloMaterialId,
} from "@/lib/coach-offer-config";
import { cn } from "@/lib/utils";

type CoachPoloMaterialPickerProps = {
  value: CoachPoloMaterialId | "";
  onChange: (value: CoachPoloMaterialId) => void;
  disabled?: boolean;
  accent?: "red" | "purple";
};

export function CoachPoloMaterialPicker({
  value,
  onChange,
  disabled = false,
  accent = "red",
}: CoachPoloMaterialPickerProps) {
  const selectedRing =
    accent === "purple"
      ? "border-jackals-purple/60 bg-jackals-purple/10 shadow-[0_0_24px_rgba(147,51,234,0.12)] ring-1 ring-jackals-purple/30"
      : "border-jackals-red/60 bg-jackals-red/10 shadow-[0_0_24px_rgba(232,34,42,0.12)] ring-1 ring-jackals-red/30";

  const selectedBadge =
    accent === "purple"
      ? "border-jackals-purple bg-jackals-purple text-white"
      : "border-jackals-red bg-jackals-red text-white";

  return (
    <div
      role="radiogroup"
      aria-label="Coach polo material"
      className="grid grid-cols-2 gap-3"
    >
      {COACH_POLO_MATERIALS.map((material) => {
        const selected = value === material.id;

        return (
          <button
            key={material.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(material.id)}
            className={cn(
              "relative flex h-full flex-col overflow-hidden rounded-xl border text-left transition-all",
              selected
                ? selectedRing
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <div className="relative aspect-[4/3] w-full bg-white/[0.04]">
              <Image
                src={material.imagePath}
                alt={material.imageAlt}
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 45vw, 220px"
              />
              <span
                className={cn(
                  "absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border",
                  selected
                    ? selectedBadge
                    : "border-white/20 bg-black/40 text-transparent",
                )}
                aria-hidden
              >
                <Check className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="space-y-0.5 p-3.5">
              <p className="font-display text-base font-semibold text-white">
                {material.label}
              </p>
              <p className="text-xs text-zinc-500">{material.subtitle}</p>
              <p className="text-xs leading-relaxed text-zinc-400">
                {material.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
