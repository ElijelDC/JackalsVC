export const GALLERY_CATEGORIES = ["MATCH", "TRAINING", "SOCIAL", "EVENT"] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export const GALLERY_FILTER_OPTIONS = ["ALL", ...GALLERY_CATEGORIES] as const;
