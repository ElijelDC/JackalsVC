import type { CSSProperties } from "react";

/** Inline layout so next/image `fill` stays contained before Tailwind loads. */
export function fillImageStyle(aspectRatio?: `${number} / ${number}`): CSSProperties {
  return {
    position: "relative",
    overflow: "hidden",
    ...(aspectRatio ? { aspectRatio } : {}),
  };
}
