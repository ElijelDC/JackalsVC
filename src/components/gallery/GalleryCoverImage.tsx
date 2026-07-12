"use client";

import { useState } from "react";
import { GalleryImage } from "@/components/gallery/GalleryImage";
import { fillImageStyle } from "@/lib/fill-image-layout";
import { cn } from "@/lib/utils";

export function GalleryCoverImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = true,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn("relative overflow-hidden bg-jackals-inset", className)}
      style={fillImageStyle()}
    >
      <GalleryImage
        src={src}
        alt={alt}
        sizes={sizes}
        priority={priority}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"
      />
    </div>
  );
}
