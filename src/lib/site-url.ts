const DEFAULT_SITE_URL = "http://localhost:3000";

export function absoluteSiteUrl(siteUrl: string, path: string) {
  if (path.startsWith("http")) return path;
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function siteUrlFromRequest(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host = request.headers.get("host");
  if (!host) return DEFAULT_SITE_URL;

  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export function getSiteUrlFromHeaders(headersList: Headers) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host = headersList.get("host");
  if (!host) return DEFAULT_SITE_URL;

  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}
