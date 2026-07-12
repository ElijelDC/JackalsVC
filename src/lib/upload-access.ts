import { PUBLIC_PATHS } from "@/lib/public-paths";

/** Append a registration token so pre-login users can view their VLY photo. */
export function withUploadAccessToken(
  url: string | null | undefined,
  token?: string | null,
): string | null {
  if (!url) return null;
  if (!token) return url;
  if (!url.includes(PUBLIC_PATHS.uploads.vlyMembershipPhotos)) return url;

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}rt=${encodeURIComponent(token)}`;
}
