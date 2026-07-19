"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getCroppedImageFile } from "@/lib/crop-image";

export function ImageCropDialog({
  open,
  imageSrc,
  aspect,
  aspectLabel,
  title = "Crop image",
  confirmLabel = "Use crop",
  outputWidth,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  imageSrc: string | null;
  aspect: number;
  aspectLabel: string;
  title?: string;
  confirmLabel?: string;
  outputWidth?: number;
  onCancel: () => void;
  onConfirm: (file: File) => void | Promise<void>;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    setError(null);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, {
        fileName: `tournament-cover-${Date.now()}.jpg`,
        outputWidth,
      });
      await onConfirm(file);
    } catch (cropError) {
      setError(
        cropError instanceof Error
          ? cropError.message
          : "Could not crop image.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open && Boolean(imageSrc)}
      onClose={onCancel}
      title={title}
      description={
        <p className="text-sm text-zinc-400">
          Drag to position, pinch or use the slider to zoom. Frame is locked to{" "}
          <span className="text-zinc-200">{aspectLabel}</span> so it matches the
          Our Tournaments card exactly.
        </p>
      }
      className="max-w-3xl"
      closeOnBackdrop={!busy}
      closeOnEscape={!busy}
    >
      <div className="space-y-4">
        <div className="relative h-[min(55dvh,22rem)] overflow-hidden border border-white/10 bg-black">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
              showGrid
            />
          ) : null}
        </div>

        <div>
          <label
            htmlFor="crop-zoom"
            className="text-xs font-semibold uppercase tracking-widest text-zinc-500"
          >
            Zoom
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-2 w-full accent-jackals-red"
            disabled={busy}
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || !croppedAreaPixels}
            onClick={() => void handleConfirm()}
          >
            {busy ? "Cropping…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
