"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_SCALE = 2.5;

function distance(
  a: { clientX: number; clientY: number },
  b: { clientX: number; clientY: number },
) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function midpoint(
  a: { clientX: number; clientY: number },
  b: { clientX: number; clientY: number },
) {
  return {
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2,
  };
}

/**
 * Mobile-friendly image viewer: pinch to zoom, drag to pan, double-tap to zoom.
 */
export function ZoomableImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [gesturing, setGesturing] = useState(false);

  const pointers = useRef(
    new Map<number, { clientX: number; clientY: number }>(),
  );
  const pinchStart = useRef<{
    distance: number;
    scale: number;
    midpoint: { x: number; y: number };
  } | null>(null);
  const panStart = useRef<{
    x: number;
    y: number;
    offset: { x: number; y: number };
  } | null>(null);
  const tapCandidate = useRef<{
    x: number;
    y: number;
    time: number;
    moved: boolean;
  } | null>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setGesturing(false);
    pointers.current.clear();
    pinchStart.current = null;
    panStart.current = null;
    tapCandidate.current = null;
    lastTap.current = null;
  }, [src]);

  const clampOffset = (
    nextScale: number,
    nextOffset: { x: number; y: number },
  ) => {
    const el = containerRef.current;
    if (!el || nextScale <= 1) return { x: 0, y: 0 };

    const rect = el.getBoundingClientRect();
    const maxX = ((nextScale - 1) * rect.width) / 2;
    const maxY = ((nextScale - 1) * rect.height) / 2;

    return {
      x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
      y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
    };
  };

  const zoomAt = (nextScale: number, clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const originX = clientX - rect.left - rect.width / 2;
    const originY = clientY - rect.top - rect.height / 2;
    const prev = scaleRef.current;
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    const ratio = clamped / prev;

    const nextOffset = {
      x: originX - (originX - offsetRef.current.x) * ratio,
      y: originY - (originY - offsetRef.current.y) * ratio,
    };

    setScale(clamped);
    setOffset(clampOffset(clamped, nextOffset));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setGesturing(true);
    pointers.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    if (pointers.current.size === 1) {
      tapCandidate.current = {
        x: event.clientX,
        y: event.clientY,
        time: Date.now(),
        moved: false,
      };
      if (scaleRef.current > 1) {
        panStart.current = {
          x: event.clientX,
          y: event.clientY,
          offset: offsetRef.current,
        };
      }
    }

    if (pointers.current.size === 2) {
      tapCandidate.current = null;
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = {
        distance: distance(a!, b!),
        scale: scaleRef.current,
        midpoint: midpoint(a!, b!),
      };
      panStart.current = null;
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, {
      clientX: event.clientX,
      clientY: event.clientY,
    });

    if (tapCandidate.current) {
      const moved = Math.hypot(
        event.clientX - tapCandidate.current.x,
        event.clientY - tapCandidate.current.y,
      );
      if (moved > 12) tapCandidate.current.moved = true;
    }

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const nextDistance = distance(a!, b!);
      const start = pinchStart.current;
      if (start.distance <= 0) return;

      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, start.scale * (nextDistance / start.distance)),
      );
      zoomAt(nextScale, start.midpoint.x, start.midpoint.y);
      return;
    }

    if (
      pointers.current.size === 1 &&
      panStart.current &&
      scaleRef.current > 1
    ) {
      const start = panStart.current;
      setOffset(
        clampOffset(scaleRef.current, {
          x: start.offset.x + (event.clientX - start.x),
          y: start.offset.y + (event.clientY - start.y),
        }),
      );
    }
  };

  const endPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);

    if (pointers.current.size < 2) pinchStart.current = null;

    if (pointers.current.size === 1 && scaleRef.current > 1) {
      const remaining = [...pointers.current.values()][0]!;
      panStart.current = {
        x: remaining.clientX,
        y: remaining.clientY,
        offset: offsetRef.current,
      };
    } else if (pointers.current.size === 0) {
      panStart.current = null;
      setGesturing(false);
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const candidate = tapCandidate.current;
    const isTap =
      candidate &&
      !candidate.moved &&
      Date.now() - candidate.time < DOUBLE_TAP_MS &&
      pointers.current.size === 1;

    endPointer(event);

    if (!isTap || event.pointerType === "mouse") {
      tapCandidate.current = null;
      return;
    }

    const now = Date.now();
    const prev = lastTap.current;
    if (
      prev &&
      now - prev.time < DOUBLE_TAP_MS &&
      Math.hypot(event.clientX - prev.x, event.clientY - prev.y) < 36
    ) {
      if (scaleRef.current > 1.05) {
        setScale(1);
        setOffset({ x: 0, y: 0 });
      } else {
        zoomAt(DOUBLE_TAP_SCALE, event.clientX, event.clientY);
      }
      lastTap.current = null;
      tapCandidate.current = null;
      return;
    }

    lastTap.current = { time: now, x: event.clientX, y: event.clientY };
    tapCandidate.current = null;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-[min(70dvh,560px)] w-full touch-none items-center justify-center overflow-hidden border border-white/10 bg-black sm:h-[min(75dvh,720px)]",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={endPointer}
    >
      {/* Native img keeps pinch/drag smooth; next/image is used on cards */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="max-h-full max-w-full select-none object-contain will-change-transform"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
          transformOrigin: "center center",
          transition: gesturing ? "none" : "transform 140ms ease-out",
        }}
      />
      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-black/65 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-300 sm:hidden">
        Pinch or double-tap to zoom
      </p>
    </div>
  );
}
