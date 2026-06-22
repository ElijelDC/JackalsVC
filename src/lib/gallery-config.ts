export const GALLERY_PLACEHOLDER_COVER = "/brand/logo-transparent.png";

export function isGalleryPlaceholderCover(url: string | null | undefined) {
  if (!url?.trim()) return true;
  return url === GALLERY_PLACEHOLDER_COVER;
}
