import { getProductionSiteUrl, resolveSiteUrl } from "@/lib/site-config";

const DEFAULT_SITE_URL = "http://localhost:3000";

function isLocalDevSiteUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

function siteUrlFromEnvOrHost(
  envUrl: string | undefined,
  host: string | null,
  protocol: string,
) {
  if (envUrl?.trim()) {
    const normalized = envUrl.trim().replace(/\/$/, "");
    const ignoreEnvInProd =
      process.env.NODE_ENV === "production" && isLocalDevSiteUrl(normalized);
    if (!ignoreEnvInProd) {
      return normalized;
    }
  }

  if (host) {
    return `${protocol}://${host}`;
  }

  if (process.env.NODE_ENV === "production") {
    return getProductionSiteUrl();
  }

  return resolveSiteUrl() || DEFAULT_SITE_URL;
}

export function absoluteSiteUrl(siteUrl: string, path: string) {
  if (path.startsWith("http")) return path;
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function siteUrlFromRequest(request: Request) {
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") ?? "https";
  return siteUrlFromEnvOrHost(process.env.NEXT_PUBLIC_SITE_URL, host, protocol);
}

export function getSiteUrlFromHeaders(headersList: Headers) {
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "https";
  return siteUrlFromEnvOrHost(process.env.NEXT_PUBLIC_SITE_URL, host, protocol);
}
