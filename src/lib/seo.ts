import type { Metadata } from "next";
import { resolveSiteUrl } from "@/lib/site-config";
import { PUBLIC_PATHS } from "@/lib/public-paths";
import { FACEBOOK_PAGE_URL, INSTAGRAM_PROFILE_URL } from "@/lib/social";

export const SEO_SITE_NAME = "Jackals Volleyball Club";

export const SEO_DEFAULT_DESCRIPTION =
  "Jackals Volleyball Club in Dublin — competitive Irish National League squads, weekly training, open fun sessions, tournaments, and club membership.";

export const SEO_KEYWORDS = [
  "Jackals Volleyball",
  "Jackals Volleyball Club",
  "Jackals VC",
  "volleyball club Dublin",
  "volleyball Dublin",
  "Irish National League volleyball",
  "volleyball training Dublin",
];

export const CLUB_LOCATION = {
  locality: "Dublin",
  country: "Ireland",
  countryCode: "IE",
} as const;

export const CONTACT_EMAIL_DISPLAY = "jackalsvolleyballclub@gmail.com";

export function absoluteUrl(path: string) {
  const base = resolveSiteUrl();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function fullPageTitle(pageTitle: string) {
  return `${pageTitle} | ${SEO_SITE_NAME}`;
}

type PageMetadataOptions = {
  /** Short page title — combined with site name unless absoluteTitle is set. */
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  /** Use for the homepage so the layout title template is not applied twice. */
  absoluteTitle?: string;
};

export function pageMetadata({
  title,
  description = SEO_DEFAULT_DESCRIPTION,
  path = "/",
  noIndex = false,
  absoluteTitle,
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const ogImage = absoluteUrl(PUBLIC_PATHS.brand.logo);
  const resolvedTitle = absoluteTitle ?? fullPageTitle(title);

  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    keywords: SEO_KEYWORDS,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_IE",
      url,
      siteName: SEO_SITE_NAME,
      title: resolvedTitle,
      description,
      images: [{ url: ogImage, alt: SEO_SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [ogImage],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: SEO_SITE_NAME,
    alternateName: "Jackals VC",
    url: absoluteUrl("/"),
    logo: absoluteUrl(PUBLIC_PATHS.brand.logo),
    description: SEO_DEFAULT_DESCRIPTION,
    email: CONTACT_EMAIL_DISPLAY,
    address: {
      "@type": "PostalAddress",
      addressLocality: CLUB_LOCATION.locality,
      addressCountry: CLUB_LOCATION.countryCode,
    },
    sameAs: [INSTAGRAM_PROFILE_URL, FACEBOOK_PAGE_URL],
  };
}

export function privatePageMetadata(title: string) {
  return pageMetadata({ title, noIndex: true });
}

export function adminPageMetadata(title: string) {
  return privatePageMetadata(title);
}

export const SEO_COPY = {
  aboutHero:
    "Jackals Volleyball Club is a community-driven club based in Dublin, fielding competitive squads in Irish National League structures while welcoming players of all levels.",
  aboutWhereWeTrain:
    "We train at venues across the Dublin area. Session locations and times are listed on our Events page — open fun sessions, league training, and skills clinics throughout the season.",
  aboutHowToJoin:
    "New to the club? Browse upcoming events to try an open session, explore our squads on the Teams page, then get in touch with any questions. League players typically join through membership after attending training.",
  teamsIntro:
    "Jackals Volleyball Club fields competitive squads in Irish National League structures from Dublin. Browse our teams below — each squad lists coaches, players, and league level. Interested in joining? Get in touch or come along to an open session.",
  eventsIntro:
    "Upcoming Jackals Volleyball Club sessions in Dublin — open fun volleyball, tournaments, skills clinics, and social events. New players are welcome at open sessions; check details and add events to your calendar.",
  contactHero:
    "Questions about training, events, or joining Jackals Volleyball Club in Dublin? Email us, message @jackalsvolleyball on Instagram, or follow us on Facebook — we would love to hear from you.",
} as const;
