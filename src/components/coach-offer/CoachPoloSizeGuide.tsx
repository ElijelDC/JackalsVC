"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import { ZoomableImage } from "@/components/sponsors/ZoomableImage";
import { Modal } from "@/components/ui/Modal";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export function CoachPoloSizeGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-jackals-red transition-colors hover:text-jackals-red-hover"
      >
        <Ruler className="h-4 w-4 shrink-0" aria-hidden />
        View Jackals Coach Polo size guide
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Jackals Coach Polo size guide"
        description={
          <p className="text-sm leading-relaxed text-zinc-400">
            Chest width (A), body length (B), and sleeve (C) in centimetres.
            Pinch or double-tap to zoom on mobile.
          </p>
        }
        className="max-w-[min(100%,40rem)]"
      >
        <ZoomableImage
          src={PUBLIC_PATHS.downloads.coachOfferPoloSizeGuide}
          alt="Jackals Coach Polo size chart showing measurements for sizes 3XS through 2XL"
          className="mx-auto w-full rounded-sm border border-white/10 bg-white"
        />
      </Modal>
    </>
  );
}
