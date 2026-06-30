"use client";

import {
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { useIntersectionVisible } from "@/hooks/useIntersectionVisible";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

export type MotionVariant =
  | "fade-up"
  | "scale-in"
  | "slide-left"
  | "slide-right"
  | "blur-in"
  | "pop-in"
  | "spring-up";

const variantClass: Record<MotionVariant, string> = {
  "fade-up": "motion-fade-up",
  "scale-in": "motion-scale-in",
  "slide-left": "motion-slide-left",
  "slide-right": "motion-slide-right",
  "blur-in": "motion-blur-in",
  "pop-in": "motion-pop-in",
  "spring-up": "motion-spring-up",
};

type AnimateInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
  style?: CSSProperties;
  immediate?: boolean;
  variant?: MotionVariant;
};

export function AnimateIn({
  children,
  className,
  delay = 0,
  as: Component = "div",
  style,
  immediate = false,
  variant = "fade-up",
}: AnimateInProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const skipAnimation = immediate || prefersReducedMotion;
  const { ref, visible: intersecting } = useIntersectionVisible<HTMLElement>({
    disabled: skipAnimation,
  });
  const visible = skipAnimation || intersecting;

  return (
    <Component
      ref={ref}
      className={cn(
        variantClass[variant],
        visible && "motion-visible",
        className,
      )}
      style={{ ...style, transitionDelay: `${delay}ms` }}
    >
      {children}
    </Component>
  );
}
