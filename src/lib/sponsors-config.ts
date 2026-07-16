import type { LucideIcon } from "lucide-react";
import {
  Globe,
  Megaphone,
  Shield,
  Shirt,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Volleyball,
} from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/contact";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export const SPONSORSHIP_EMAIL = CONTACT_EMAIL;
export const SPONSOR_PRESENTATION_URL =
  PUBLIC_PATHS.downloads.sponsorPresentation;
export const SPONSOR_PRESENTATION_FILENAME =
  "Jackals-VC-Sponsor-Presentation-2026-27.pdf";

export const SPONSOR_HERO_STATS: {
  icon: LucideIcon;
  value: string;
  label: string;
}[] = [
  { icon: Shield, value: "3", label: "competitive teams" },
  { icon: Users, value: "550+", label: "social members" },
  { icon: UserCheck, value: "40+", label: "club members" },
  {
    icon: Volleyball,
    value: "150+",
    label: "training and social volleyball sessions year round",
  },
  { icon: TrendingUp, value: "15K+", label: "monthly reach" },
  { icon: Trophy, value: "40+", label: "league matches per year" },
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

export function sponsorInquiryMailto(subject = "Sponsorship enquiry") {
  return `mailto:${SPONSORSHIP_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
