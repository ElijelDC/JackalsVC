/** Production domain — registered on Cloudflare. */
export const SITE_DOMAIN = "jackalsvolleyball.com";

export const SITE_WWW_HOST = `www.${SITE_DOMAIN}`;

export function getProductionSiteUrl() {
  return `https://${SITE_DOMAIN}`;
}

/** Canonical origin for metadata, emails, and calendar exports. */
export function resolveSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  return getProductionSiteUrl();
}

export function getSiteMetadataBase() {
  return new URL(`${resolveSiteUrl()}/`);
}

/** iCal UID host — stable per club domain. */
export const CALENDAR_UID_DOMAIN = SITE_DOMAIN;
