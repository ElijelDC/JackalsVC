"use client";

import { useState } from "react";
import Image from "next/image";
import { ProductPlaceholder } from "@/components/shop/ProductPlaceholder";
import { fillImageStyle } from "@/lib/fill-image-layout";
import { normalizePublicAssetUrl } from "@/lib/public-paths";
import { cn } from "@/lib/utils";

export function GalleryCoverImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = normalizePublicAssetUrl(src);

  if (imageError) {
    return <ProductPlaceholder className={className} size="md" />;
  }

  return (
    <div
      className={cn("relative overflow-hidden bg-jackals-inset", className)}
      style={fillImageStyle()}
    >
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        sizes={sizes}
        onError={() => setImageError(true)}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
      />
    </div>
  );
}
