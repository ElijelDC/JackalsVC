"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type MotionVariant =
  | "fade-up"
  | "scale-in"
  | "slide-left"
  | "slide-right"
  | "blur-in";

const variantClass: Record<MotionVariant, string> = {
  "fade-up": "motion-fade-up",
  "scale-in": "motion-scale-in",
  "slide-left": "motion-slide-left",
  "slide-right": "motion-slide-right",
  "blur-in": "motion-blur-in",
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
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(immediate);

  useEffect(() => {
    if (immediate) return;

    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -2% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [immediate]);

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
