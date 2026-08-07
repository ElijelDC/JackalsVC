"use client";

import { useEffect, useId, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

/** Two clean bolt paths — only one strikes at a time. */
const BOLTS = [
  // Top-right → bottom-left
  "M142 16 L118 52 L132 52 L88 118 L102 118 L64 184",
  // Top-left → bottom-right
  "M58 18 L84 56 L70 56 L116 120 L102 120 L148 186",
] as const;

const STRIKE_MS = 420;
const IDLE_MS = 3200;

const ACCENT_STROKE = {
  red: { outer: "#e8222a", core: "#fff5f5" },
  purple: { outer: "#9333ea", core: "#f3e8ff" },
} as const;

/**
 * Periodic lightning strike around the hero logo.
 * Sequence: brief flash → bolt → fade → idle a few seconds → repeat.
 */
export function ClubOfferLogoLightning({
  accent = "red",
}: {
  accent?: "red" | "purple";
}) {
  const reactId = useId().replace(/:/g, "");
  const glowId = `club-offer-bolt-glow-${reactId}`;
  const prefersReducedMotion = usePrefersReducedMotion();
  const [boltIndex, setBoltIndex] = useState(0);
  const [striking, setStriking] = useState(false);
  const strokes = ACCENT_STROKE[accent];

  useEffect(() => {
    if (prefersReducedMotion) return;

    let strikeTimer: ReturnType<typeof setTimeout> | undefined;
    let cycleTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const runStrike = () => {
      if (cancelled) return;
      setBoltIndex((current) => (current + 1) % BOLTS.length);
      setStriking(true);
      strikeTimer = setTimeout(() => {
        if (cancelled) return;
        setStriking(false);
        cycleTimer = setTimeout(runStrike, IDLE_MS);
      }, STRIKE_MS);
    };

    cycleTimer = setTimeout(runStrike, 900);

    return () => {
      cancelled = true;
      if (strikeTimer) clearTimeout(strikeTimer);
      if (cycleTimer) clearTimeout(cycleTimer);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  const path = BOLTS[boltIndex];

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute -inset-14 z-0 sm:-inset-12",
        striking && "club-offer-strike-active",
      )}
    >
      <div className="club-offer-strike-flash absolute inset-[18%] rounded-full blur-2xl" />

      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          key={`${boltIndex}-${striking ? "on" : "off"}`}
          className={cn("club-offer-strike-bolt", striking && "is-striking")}
          filter={`url(#${glowId})`}
        >
          <path
            d={path}
            fill="none"
            stroke={strokes.outer}
            strokeWidth="4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <path
            d={path}
            fill="none"
            stroke={strokes.core}
            strokeWidth="1.4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </g>
      </svg>
    </div>
  );
}
