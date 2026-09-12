import Image from "next/image";
import Link from "next/link";
import { PUBLIC_PATHS } from "@/lib/public-paths";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { px: 36, className: "h-9 w-9" },
  nav: { px: 56, className: "h-14 w-14" },
  lg: { px: 64, className: "h-16 w-16" },
  footer: { px: 104, className: "h-[6.5rem] w-[6.5rem]" },
  hero: { px: 320, className: "h-64 w-64 sm:h-80 sm:w-80 lg:h-96 lg:w-96" },
} as const;

type LogoSize = keyof typeof sizes;

export function Logo({
  size = "nav",
  showText = false,
  className,
  href = "/",
  glow = false,
  active = false,
}: {
  size?: LogoSize;
  showText?: boolean;
  className?: string;
  href?: string | null;
  glow?: boolean;
  active?: boolean;
}) {
  const { px, className: sizeClass } = sizes[size];

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "logo-mark relative block shrink-0",
          sizeClass,
          glow && "red-glow-sm",
        )}
      >
        <Image
          src={PUBLIC_PATHS.brand.logoTransparent}
          alt=""
          width={px}
          height={px}
          className={cn(
            "h-full w-full object-contain",
            active && "logo-image-home-active",
          )}
          priority={size === "hero" || size === "nav"}
          aria-hidden
        />
      </span>
      {showText && (
        <span className="logo-text hidden font-display text-lg font-bold tracking-wider text-white sm:inline lg:text-xl">
          <span className="logo-text-main text-zinc-200">Jackals </span>
          <span className="logo-text-accent text-jackals-red">VC</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="logo-link rounded-sm"
        aria-label="Jackals VC home"
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return content;
}
