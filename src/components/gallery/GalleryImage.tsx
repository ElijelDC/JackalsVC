"use client";

import { useState } from "react";
import Image from "next/image";
import { ProductPlaceholder } from "@/components/shop/ProductPlaceholder";
import { normalizePublicAssetUrl } from "@/lib/public-paths";
import { cn } from "@/lib/utils";

export function GalleryImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  placeholderClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  placeholderClassName?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = normalizePublicAssetUrl(src);

  if (imageError) {
    return (
      <ProductPlaceholder
        className={cn("h-full w-full", placeholderClassName)}
        size="md"
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={className}
      sizes={sizes}
      onError={() => setImageError(true)}
    />
  );
}
