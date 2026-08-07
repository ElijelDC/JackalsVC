"use client";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const RED_PIECES = [
  { cx: "-90px", cy: "-120px", color: "#e8222a", delay: "0ms", w: 8, h: 14 },
  { cx: "70px", cy: "-130px", color: "#ff4d54", delay: "40ms", w: 7, h: 12 },
  { cx: "-40px", cy: "-150px", color: "#f5f5f5", delay: "70ms", w: 6, h: 10 },
  { cx: "110px", cy: "-90px", color: "#e8222a", delay: "20ms", w: 9, h: 9 },
  { cx: "-120px", cy: "-70px", color: "#ff4d54", delay: "90ms", w: 6, h: 13 },
  { cx: "30px", cy: "-160px", color: "#ffffff", delay: "50ms", w: 5, h: 11 },
  { cx: "-70px", cy: "-100px", color: "#e8222a", delay: "110ms", w: 7, h: 7 },
  { cx: "95px", cy: "-115px", color: "#a3a3a3", delay: "30ms", w: 8, h: 8 },
  { cx: "0px", cy: "-170px", color: "#ff4d54", delay: "60ms", w: 6, h: 12 },
  { cx: "-100px", cy: "-140px", color: "#ffffff", delay: "80ms", w: 5, h: 9 },
  { cx: "55px", cy: "-80px", color: "#e8222a", delay: "100ms", w: 8, h: 10 },
  { cx: "-20px", cy: "-125px", color: "#ff4d54", delay: "15ms", w: 7, h: 11 },
] as const;

const PURPLE_PIECES = [
  { cx: "-90px", cy: "-120px", color: "#9333ea", delay: "0ms", w: 8, h: 14 },
  { cx: "70px", cy: "-130px", color: "#c084fc", delay: "40ms", w: 7, h: 12 },
  { cx: "-40px", cy: "-150px", color: "#f5f5f5", delay: "70ms", w: 6, h: 10 },
  { cx: "110px", cy: "-90px", color: "#9333ea", delay: "20ms", w: 9, h: 9 },
  { cx: "-120px", cy: "-70px", color: "#a855f7", delay: "90ms", w: 6, h: 13 },
  { cx: "30px", cy: "-160px", color: "#ffffff", delay: "50ms", w: 5, h: 11 },
  { cx: "-70px", cy: "-100px", color: "#9333ea", delay: "110ms", w: 7, h: 7 },
  { cx: "95px", cy: "-115px", color: "#a3a3a3", delay: "30ms", w: 8, h: 8 },
  { cx: "0px", cy: "-170px", color: "#c084fc", delay: "60ms", w: 6, h: 12 },
  { cx: "-100px", cy: "-140px", color: "#ffffff", delay: "80ms", w: 5, h: 9 },
  { cx: "55px", cy: "-80px", color: "#9333ea", delay: "100ms", w: 8, h: 10 },
  { cx: "-20px", cy: "-125px", color: "#a855f7", delay: "15ms", w: 7, h: 11 },
] as const;

/** Tasteful accent/white burst for offer acceptance — CSS-only, short-lived. */
export function ClubOfferConfetti({
  accent = "red",
}: {
  accent?: "red" | "purple";
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  if (prefersReducedMotion) return null;

  const pieces = accent === "purple" ? PURPLE_PIECES : RED_PIECES;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-2 flex h-0 justify-center overflow-visible"
    >
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="club-offer-confetti-piece absolute top-0 rounded-[1px]"
          style={
            {
              "--cx": piece.cx,
              "--cy": piece.cy,
              width: piece.w,
              height: piece.h,
              backgroundColor: piece.color,
              animationDelay: piece.delay,
              boxShadow: `0 0 10px ${piece.color}66`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
