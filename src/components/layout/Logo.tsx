import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { px: 32, className: "h-8 w-8" },
  nav: { px: 52, className: "h-[52px] w-[52px]" },
  lg: { px: 56, className: "h-14 w-14" },
  hero: { px: 320, className: "h-64 w-64 sm:h-80 sm:w-80 lg:h-96 lg:w-96" },
} as const;

type LogoSize = keyof typeof sizes;

export function Logo({
  size = "nav",
  showText = false,
  className,
  href = "/",
  glow = false,
}: {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
  href?: string | null;
  glow?: boolean;
}) {
  const { px, className: sizeClass } = sizes[size];

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative block shrink-0",
          sizeClass,
          glow && "red-glow-sm",
        )}
      >
        <Image
          src="/logo.png"
          alt=""
          width={px}
          height={px}
          className="h-full w-full object-contain mix-blend-lighten"
          priority={size === "hero" || size === "nav"}
          aria-hidden
        />
      </span>
      {showText && (
        <span className="hidden font-display text-lg font-bold tracking-wider text-white sm:inline lg:text-xl">
          Jackals <span className="text-jackals-red">VC</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-90" aria-label="Jackals VC home">
        {content}
      </Link>
    );
  }

  return content;
}
