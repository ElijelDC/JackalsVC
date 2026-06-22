import Image from "next/image";
import { cn } from "@/lib/utils";

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-28 w-28 text-3xl",
} as const;

export function MemberAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const sizeClass = SIZE_CLASSES[size];

  if (imageUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full border border-white/10 bg-jackals-inset",
          sizeClass,
          className,
        )}
      >
        <Image
          src={imageUrl}
          alt={`${name} profile`}
          fill
          sizes={size === "xl" ? "112px" : size === "lg" ? "80px" : "40px"}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-jackals-red/15 font-semibold text-jackals-red-light",
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {initialsFromName(name) || "?"}
    </div>
  );
}
