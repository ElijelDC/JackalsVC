"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import { ZoomableImage } from "@/components/sponsors/ZoomableImage";
import { Modal } from "@/components/ui/Modal";
import {
  KIT_ORDER_JACKET_SIZE_CHART,
  KIT_ORDER_SIZE_CHARTS,
  KIT_ORDER_TSHIRT_SIZE_CHART,
  kitOrderJacketSizeGuideSrc,
  kitOrderSizeGuideSrc,
  kitOrderTshirtSizeGuideSrc,
  type KitOrderGender,
} from "@/lib/kit-order-config";

type KitSizeGuideProps =
  | { kind?: "kit"; gender: KitOrderGender }
  | { kind: "tshirt" | "jacket" };

function guideCopy(props: KitSizeGuideProps) {
  if (props.kind === "tshirt") {
    return {
      title: "Training t-shirt size guide",
      description:
        "Legea M1194 measurements in centimetres: chest width (A), length (B), and sleeve (C).",
      imageSrc: kitOrderTshirtSizeGuideSrc(),
      imageAlt:
        "Legea M1194 t-shirt size chart showing chest width, length, and sleeve for sizes 3XS through 2XL",
      chart: KIT_ORDER_TSHIRT_SIZE_CHART,
    };
  }

  if (props.kind === "jacket") {
    return {
      title: "Jacket size guide",
      description:
        "Legea M1166 measurements in centimetres for all club jackets: chest width (A) and length (B).",
      imageSrc: kitOrderJacketSizeGuideSrc(),
      imageAlt:
        "Legea M1166 jacket size chart showing chest width and length for sizes 3XS through 4XL",
      chart: KIT_ORDER_JACKET_SIZE_CHART,
    };
  }

  const title =
    props.gender === "women"
      ? "Women's kit size guide"
      : "Men's kit size guide";

  return {
    title,
    description:
      "Legea Classic kit measurements in centimetres, with a ±5% tolerance. Pinch or double-tap to zoom the chart.",
    imageSrc: kitOrderSizeGuideSrc(props.gender),
    imageAlt: `${title} showing chest, back length, waist, and shorts length`,
    chart: KIT_ORDER_SIZE_CHARTS[props.gender],
  };
}

export function KitSizeGuide(props: KitSizeGuideProps) {
  const [open, setOpen] = useState(false);
  const copy = guideCopy(props);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-jackals-red transition-colors hover:text-jackals-red-hover"
      >
        <Ruler className="h-4 w-4 shrink-0" aria-hidden />
        Size guide
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={copy.title}
        description={
          <p className="text-sm leading-relaxed text-zinc-400">
            {copy.description}
          </p>
        }
        className="max-w-[min(100%,44rem)]"
      >
        <div className="space-y-4">
          <ZoomableImage
            src={copy.imageSrc}
            alt={copy.imageAlt}
            className="mx-auto w-full rounded-sm border border-white/10 bg-white"
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left text-xs text-zinc-300 sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-500">
                  <th className="py-2 pr-3 font-medium">Measurement</th>
                  {copy.chart.sizes.map((size) => (
                    <th key={size} className="px-1.5 py-2 text-center font-medium">
                      {size}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {copy.chart.rows.map((row) => (
                  <tr key={row.key} className="border-b border-white/5">
                    <th className="py-2 pr-3 font-medium text-zinc-400">
                      {row.label}
                    </th>
                    {row.values.map((value, index) => (
                      <td
                        key={`${row.key}-${copy.chart.sizes[index]}`}
                        className="px-1.5 py-2 text-center tabular-nums"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </>
  );
}
