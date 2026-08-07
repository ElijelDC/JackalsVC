"use client";

import Image from "next/image";
import { ClubOfferLogoLightning } from "@/components/club-offer/ClubOfferLogoLightning";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { PUBLIC_PATHS } from "@/lib/public-paths";
import { cn } from "@/lib/utils";

export function OfferHeroLogo({ accent }: { accent: "red" | "purple" }) {
  const isPurple = accent === "purple";

  return (
    <AnimateIn immediate variant="scale-in">
      <div className="relative mx-auto mb-6 overflow-visible sm:mb-8">
        <div className="relative mx-auto h-44 w-44 overflow-visible sm:h-48 sm:w-48">
          <ClubOfferLogoLightning accent={accent} />
          <div className="relative z-10 h-full w-full">
            <Image
              src={PUBLIC_PATHS.brand.logoTransparent}
              alt="Jackals Volleyball Club"
              fill
              className={cn(
                "object-contain",
                isPurple
                  ? "drop-shadow-[0_0_36px_rgba(147,51,234,0.65)]"
                  : "drop-shadow-[0_0_36px_rgba(232,34,42,0.7)]",
              )}
              priority
            />
          </div>
        </div>
      </div>
    </AnimateIn>
  );
}
