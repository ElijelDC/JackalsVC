import type { LucideIcon } from "lucide-react";
import {
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Volleyball,
  Shield,
} from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/contact";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export const SPONSORSHIP_EMAIL = CONTACT_EMAIL;
export const SPONSOR_PRESENTATION_URL =
  PUBLIC_PATHS.downloads.sponsorPresentation;
export const SPONSOR_PRESENTATION_FILENAME =
  "Jackals-VC-Sponsor-Presentation-2026-27.pdf";

/** One short mention for the sponsors page — keep usage minimal. */
export const SPONSOR_CHAMPIONSHIP_NOTE =
  "Proud Division 3 Irish National League winners in 2024/25.";

export const SPONSOR_HERO_STATS: {
  icon: LucideIcon;
  value: string;
  label: string;
}[] = [
  { icon: Shield, value: "3", label: "competitive teams" },
  { icon: Users, value: "550+", label: "social members" },
  { icon: UserCheck, value: "45+", label: "club members" },
  {
    icon: Volleyball,
    value: "150+",
    label: "training and social volleyball sessions year round",
  },
  { icon: TrendingUp, value: "15K+", label: "monthly reach" },
  { icon: Trophy, value: "40+", label: "league matches per season" },
];

export const SPONSOR_WHY_POINTS = [
  {
    title: "Reach an engaged community",
    description:
      "Players, supporters, and families who train weekly, travel to matches, and share club life on and off the court.",
  },
  {
    title: "Align with a growing club",
    description:
      "Jackals VC competes in Irish National League structures with ambitious squads and a welcoming club culture.",
  },
  {
    title: "Visible, year-round presence",
    description:
      "League matchdays, tournaments, social events, and digital channels give sponsors repeated exposure across the season.",
  },
  {
    title: "Partnership, not a logo drop",
    description:
      "We work with sponsors on activations that fit your brand — from match-day hospitality to co-branded events.",
  },
] as const;

const SPONSOR_EXAMPLE_BASE = "/downloads/sponsor-examples";

/** Package deals for the 2026/27 season. */
export const SPONSOR_PACKAGES: {
  name: string;
  priceLabel: string;
  summary: string;
  highlights: string[];
  exampleImage: string;
  /** Full example opened in the lightbox (defaults to exampleImage). */
  exampleFullImage?: string;
  exampleAlt: string;
}[] = [
  {
    name: "Club Partner",
    priceLabel: "€150",
    summary: "For local businesses supporting grassroots volleyball.",
    highlights: [
      "Logo and link on the Our Sponsors page",
      "Recognition on Instagram and Facebook",
      "Sponsor thank-you post",
    ],
    exampleImage: `${SPONSOR_EXAMPLE_BASE}/sponsor-package-club-partner.png`,
    exampleAlt: "Club Partner example — website listing and thank-you post",
  },
  {
    name: "Spotlight Partner",
    priceLabel: "€500",
    summary: "For businesses looking for more visibility.",
    highlights: [
      "All Club Partner benefits",
      "Logo on Match Week & Match Results posts (Instagram & Facebook)",
      "Multiple social media mentions throughout the season",
      "Recognition on club event and session pages",
    ],
    exampleImage: `${SPONSOR_EXAMPLE_BASE}/sponsor-package-spotlight-partner.png`,
    exampleAlt: "Spotlight Partner example — Match Week, Results, and session recognition",
  },
  {
    name: "Matchday & Kit Partner",
    priceLabel: "€1,000",
    summary: "Our premium partnership opportunity.",
    highlights: [
      "All Spotlight Partner benefits",
      "Logo placement on match/training kit",
      "Brand visibility during league matches and tournaments",
      "Matchday recognition and announcements",
      "Photos and content featuring your brand",
    ],
    exampleImage: `${SPONSOR_EXAMPLE_BASE}/sponsor-package-matchday-kit-partner.png`,
    exampleAlt: "Matchday & Kit Partner example — kit, banner, and matchday recognition",
  },
];

export const SPONSOR_PACKAGES_NOTE =
  "Three options for the 2026/27 season — custom arrangements welcome.";

export const SPONSOR_IMPACT_LINE =
  "Your sponsorship directly supports court hire, player development, competitive volleyball, and affordable access to the sport in our local community.";

/** Partner listing on /sponsors/partners. Logos live under public/sponsors/. */
export type ClubSponsorTier = "club" | "spotlight" | "matchday";

export type ClubSponsor = {
  name: string;
  blurb: string;
  href: string;
  logoSrc: string;
  tier: ClubSponsorTier;
};

export const SPONSOR_TIER_LABELS: Record<ClubSponsorTier, string> = {
  club: "Club Partners",
  spotlight: "Spotlight Partners",
  matchday: "Matchday & Kit Partners",
};

/** Display order for tier sections (premium first). */
export const SPONSOR_TIER_ORDER: ClubSponsorTier[] = [
  "matchday",
  "spotlight",
  "club",
];

/**
 * Active club partners featured on the Our Sponsors page.
 * Add entries here and drop logo files into public/sponsors/.
 */
export const CLUB_SPONSORS: ClubSponsor[] = [];

export function sponsorsByTier(
  sponsors: readonly ClubSponsor[] = CLUB_SPONSORS,
): { tier: ClubSponsorTier; label: string; sponsors: ClubSponsor[] }[] {
  return SPONSOR_TIER_ORDER.map((tier) => ({
    tier,
    label: SPONSOR_TIER_LABELS[tier],
    sponsors: sponsors.filter((s) => s.tier === tier),
  })).filter((group) => group.sponsors.length > 0);
}

export function sponsorInquiryMailto(subject = "Sponsorship enquiry") {
  return `mailto:${SPONSORSHIP_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
