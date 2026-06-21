import Image from "next/image";
import { cn } from "@/lib/utils";
import { ProductPlaceholder } from "@/components/shop/ProductPlaceholder";

export function ProductImage({
  imageUrl,
  alt = "",
  className,
  sizes = "(max-width: 768px) 100vw, 33vw",
}: {
  imageUrl?: string | null;
  alt?: string;
  className?: string;
  sizes?: string;
}) {
  if (imageUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-jackals-inset", className)}>
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={sizes}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80"
        />
      </div>
    );
  }

  return <ProductPlaceholder className={className} />;
}
