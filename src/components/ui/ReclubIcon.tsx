import Image from "next/image";
import { PUBLIC_PATHS } from "@/lib/public-paths";
import { cn } from "@/lib/utils";

export function ReclubIcon({ className }: { className?: string }) {
  return (
    <Image
      src={PUBLIC_PATHS.brand.reclubMark}
      alt=""
      width={20}
      height={20}
      unoptimized
      aria-hidden
      className={cn(
        "h-5 w-5 object-contain transition-transform group-hover:scale-110",
        className,
      )}
    />
  );
}
