"use client";

import type { ReactNode } from "react";
import {
  AnimateIn,
  type MotionVariant,
} from "@/components/motion/AnimateIn";

export function AnimatedBlock({
  children,
  className,
  delay = 0,
  immediate = false,
  variant = "fade-up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
  variant?: MotionVariant;
}) {
  return (
    <AnimateIn
      className={className}
      delay={delay}
      immediate={immediate}
      variant={variant}
    >
      {children}
    </AnimateIn>
  );
}
