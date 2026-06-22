"use client";

import { useEffect, useRef, useState } from "react";

type UseIntersectionVisibleOptions = {
  disabled?: boolean;
  threshold?: number;
  rootMargin?: string;
};

export function useIntersectionVisible<T extends Element = HTMLElement>({
  disabled = false,
  threshold = 0.06,
  rootMargin = "0px 0px -2% 0px",
}: UseIntersectionVisibleOptions = {}) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(disabled);

  useEffect(() => {
    if (disabled) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [disabled, rootMargin, threshold]);

  return { ref, visible };
}
