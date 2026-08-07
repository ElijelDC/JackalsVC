"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type SignaturePadProps = {
  value: string;
  onChange: (dataUrl: string) => void;
  className?: string;
  disabled?: boolean;
};

export function SignaturePad({
  value,
  onChange,
  className,
  disabled = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const inkDrawn = useRef(Boolean(value));
  const [hasInk, setHasInk] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const ratio = window.devicePixelRatio || 1;
      const width = parent.clientWidth;
      const height = 160;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#f5f5f5";
      ctx.lineWidth = 2.25;
      ctx.fillStyle = "#181919";
      ctx.fillRect(0, 0, width, height);

      if (value) {
        const image = new Image();
        image.onload = () => {
          ctx.drawImage(image, 0, 0, width, height);
          setHasInk(true);
        };
        image.src = value;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // Only re-init sizing; ink restore handled when value present at mount/resize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pointFromEvent = (
    event: React.PointerEvent<HTMLCanvasElement>,
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = pointFromEvent(event);
    if (!canvas || !ctx || !point) return;
    drawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const moveDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const point = pointFromEvent(event);
    if (!canvas || !ctx || !point) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    inkDrawn.current = true;
    setHasInk(true);
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas || !inkDrawn.current) return;
    onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.fillStyle = "#181919";
    ctx.fillRect(0, 0, width, height);
    inkDrawn.current = false;
    setHasInk(false);
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="overflow-hidden rounded-sm border border-white/15 bg-jackals-inset">
        <canvas
          ref={canvasRef}
          className={cn(
            "touch-none block w-full cursor-crosshair",
            disabled && "pointer-events-none opacity-60",
          )}
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          onPointerCancel={endDraw}
          aria-label="Signature pad"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          Sign with your finger or mouse — this confirms your acceptance.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={disabled || !hasInk}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
