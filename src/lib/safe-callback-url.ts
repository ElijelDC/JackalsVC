const DEFAULT_CALLBACK = "/dashboard";

/**
 * Keeps post-auth redirects on this site. Rejects absolute URLs (e.g. baked
 * localhost links from bad env or email query params).
 */
export function sanitizeCallbackUrl(
  callbackUrl: string | null | undefined,
  fallback = DEFAULT_CALLBACK,
) {
  if (!callbackUrl) return fallback;

  const trimmed = callbackUrl.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.includes("://") || trimmed.includes("localhost")) {
    return fallback;
  }

  return trimmed;
}
