import type { LucideIcon } from "lucide-react";
import {
  Globe,
  Megaphone,
  Shirt,
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

export const SPONSOR_VISIBILITY_CHANNELS: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Shirt,
    title: "Kit & equipment",
    description: "Match and training kit seen every week in league and tournament play.",
  },
  {
    icon: Volleyball,
    title: "Matchdays",
    description: "Home and away fixtures across Dublin and nationally — banners, PA, programmes.",
  },
  {
    icon: Megaphone,
    title: "Social media",
    description:
      "@jackalsvolleyball and facebook.com/JackalsVC — highlights, sign-ups, celebrations, and sponsor tags.",
  },
  {
    icon: Globe,
    title: "Website",
    description: "Dedicated sponsors section on jackalsvolleyball.com with logo and link to your business.",
  },
  {
    icon: Trophy,
    title: "Events & tournaments",
    description: "Club-run competitions, fun sessions, and socials with hundreds of touchpoints.",
  },
  {
    icon: Users,
    title: "Community network",
    description: "Families, students, professionals, and local businesses connected through the club.",
  },
];

/** Package deals for the 2026/27 season. */
export const SPONSOR_PACKAGES: {
  name: string;
  priceLabel: string;
  summary: string;
  highlights: string[];
}[] = [
  {
    name: "Club Partner",
    priceLabel: "€150",
    summary: "Digital and community visibility across the season.",
    highlights: [
      "Sponsor listing on jackalsvolleyball.com with link to your business",
      "Recognition on Instagram (@jackalsvolleyball) and Facebook",
      "Thank-you acknowledgement to our club community",
      "Mention in relevant club communications through the season",
      "Association with a growing competitive Dublin volleyball club",
    ],
  },
  {
    name: "Spotlight Partner",
    priceLabel: "€350",
    summary:
      "Stronger season-long promotion across our digital channels and club events.",
    highlights: [
      "All Club Partner benefits",
      "Dedicated sponsor spotlight across Instagram and Facebook",
      "Website promotion beyond a standard listing",
      "Recognition at club events and fun sessions",
      "Multiple social media mentions through the season",
    ],
  },
  {
    name: "Matchday Partner",
    priceLabel: "€750",
    summary:
      "Our highest-visibility package — kit on court plus standout matchday presence.",
    highlights: [
      "All Spotlight Partner benefits",
      "Logo on match or training kit for season-long court visibility",
      "Photos and stories featuring your brand in club content where kit is worn",
      "Matchday banners and/or announcements at home fixtures",
      "Featured recognition as a Matchday Partner",
      "Priority placement at club events and tournaments",
      "Opportunities to collaborate on activations with our growing community",
    ],
  },
];

export const SPONSOR_PACKAGES_NOTE =
  "Package deals for the 2026/27 season — from digital presence to full matchday and kit visibility. Custom arrangements are welcome.";

export function sponsorInquiryMailto(subject = "Sponsorship enquiry") {
  return `mailto:${SPONSORSHIP_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
