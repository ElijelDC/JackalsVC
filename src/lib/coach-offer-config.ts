import { PUBLIC_PATHS } from "@/lib/public-paths";

export const COACH_OFFER_TEAM_SLUGS = [
  "division-2-men",
  "division-3-women",
  "regional-men",
] as const;

export type CoachOfferTeamSlug = (typeof COACH_OFFER_TEAM_SLUGS)[number];

export type CoachOfferTeam = {
  slug: CoachOfferTeamSlug;
  shortName: string;
  fullName: string;
  league: string;
  trainingNight: string;
  venue: string;
  heroEyebrow: string;
  heroTitle: string;
  heroHighlight: string;
  heroSupport: string;
  confirmLabel: string;
  formHeading: string;
  formSupport: string;
  accentWord: string;
  accent: "red" | "purple";
  benefitsSectionLabel: string;
  benefits: string[];
  closingLine: string;
};

export const COACH_OFFER_COMMITMENT_COPY =
  "I understand that accepting this coaching offer means committing to Jackals Volleyball Club for the season. I commit to planning and running sessions responsibly, developing players with care and respect, communicating reliably with the club and my squad, showing up prepared for training and match days, and representing Jackals with professionalism on and off the court.";

export const COACH_POLO_SIZES = [
  "3XS",
  "2XS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
] as const;

export const COACH_POLO_MATERIAL_IDS = ["cotton", "polyester"] as const;

export type CoachPoloMaterialId = (typeof COACH_POLO_MATERIAL_IDS)[number];

export type CoachPoloMaterial = {
  id: CoachPoloMaterialId;
  label: string;
  subtitle: string;
  description: string;
  imagePath: string;
  imageAlt: string;
};

/** Left = cotton, right = polyester */
export const COACH_POLO_MATERIALS: CoachPoloMaterial[] = [
  {
    id: "cotton",
    label: "Cotton",
    subtitle: "Jackals Coach Polo",
    description: "Soft cotton pique with a classic feel.",
    imagePath: PUBLIC_PATHS.downloads.coachOfferPoloCotton,
    imageAlt: "Jackals Coach Polo — cotton, front and back",
  },
  {
    id: "polyester",
    label: "Polyester",
    subtitle: "Jackals Coach Polo",
    description: "Lightweight, quick-drying athletic fabric.",
    imagePath: PUBLIC_PATHS.downloads.coachOfferPoloPolyester,
    imageAlt: "Jackals Coach Polo — polyester, front and back",
  },
];

export function coachPoloMaterialLabel(materialId: string): string {
  const material = COACH_POLO_MATERIALS.find((entry) => entry.id === materialId);
  return material?.label ?? materialId;
}

const COACH_BENEFITS = [
  "Paid training — €25 per training session",
  "Free coach polo",
  "Jackals web app for session & match management",
  "Play-off bonus when your squad goes deep",
  "Help develop upcoming players",
  "Host skills clinic sessions throughout the year",
] as const;

export const COACH_OFFER_TEAMS: Record<CoachOfferTeamSlug, CoachOfferTeam> = {
  "division-2-men": {
    slug: "division-2-men",
    shortName: "Division 2 Men",
    fullName: "Men's Division 2",
    league: "National League",
    trainingNight: "Wednesday",
    venue: "Meakstown",
    heroEyebrow: "Coach offer · National League",
    heroTitle: "Coach Offer",
    heroHighlight: "Division 2 Men",
    heroSupport:
      "Congratulations — you've been offered a coaching role with Jackals Men's Division 2. Training is Wednesday nights at Meakstown.",
    confirmLabel: "Confirm my Division 2 coaching offer",
    formHeading: "Accept your Division 2 coaching role",
    formSupport:
      "Share your details, coach polo material and size, and sign below so we can get you set up for the season.",
    accentWord: "NATIONAL",
    accent: "red",
    benefitsSectionLabel: "Coaching at Jackals",
    benefits: [...COACH_BENEFITS],
    closingLine: "Confirm your coaching role on Division 2 when you're ready.",
  },
  "division-3-women": {
    slug: "division-3-women",
    shortName: "Division 3 Women",
    fullName: "Women's Division 3",
    league: "National League",
    trainingNight: "",
    venue: "Meakstown",
    heroEyebrow: "Coach offer · National League",
    heroTitle: "Coach Offer",
    heroHighlight: "Division 3 Women",
    heroSupport:
      "Congratulations — you've been offered a coaching role with Jackals Women's Division 3. Weekly training is at Meakstown.",
    confirmLabel: "Confirm my Division 3 coaching offer",
    formHeading: "Accept your Division 3 coaching role",
    formSupport:
      "Share your details, coach polo material and size, and sign below so we can get you set up for the season.",
    accentWord: "DIVISION",
    accent: "purple",
    benefitsSectionLabel: "Coaching at Jackals",
    benefits: [...COACH_BENEFITS],
    closingLine: "Confirm your coaching role on Division 3 when you're ready.",
  },
  "regional-men": {
    slug: "regional-men",
    shortName: "Regional Men",
    fullName: "Regional Men",
    league: "Regional League",
    trainingNight: "",
    venue: "Meakstown",
    heroEyebrow: "Coach offer · Regional League",
    heroTitle: "Coach Offer",
    heroHighlight: "Regional Men",
    heroSupport:
      "Congratulations — you've been offered a coaching role with Jackals Regional Men. Weekly training is at Meakstown.",
    confirmLabel: "Confirm my coaching offer",
    formHeading: "Accept your coaching role",
    formSupport:
      "Share your details, coach polo material and size, and sign below so we can get you set up for the season.",
    accentWord: "REGIONAL",
    accent: "red",
    benefitsSectionLabel: "Coaching at Jackals",
    benefits: [...COACH_BENEFITS],
    closingLine: "Confirm your coaching role on Regional Men when you're ready.",
  },
};

export function isCoachOfferTeamSlug(value: string): value is CoachOfferTeamSlug {
  return (COACH_OFFER_TEAM_SLUGS as readonly string[]).includes(value);
}

export function getCoachOfferTeam(slug: string): CoachOfferTeam | null {
  if (!isCoachOfferTeamSlug(slug)) return null;
  return COACH_OFFER_TEAMS[slug];
}

export function coachOfferTeamLabel(slug: CoachOfferTeamSlug) {
  return COACH_OFFER_TEAMS[slug].shortName;
}
