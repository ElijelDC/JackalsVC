export const CLUB_OFFER_TEAM_SLUGS = [
  "division-2-men",
  "division-3-women",
  "division-3-men",
] as const;

/** @deprecated Old offer URL slug — redirects to division-3-men */
export const CLUB_OFFER_LEGACY_TEAM_SLUG = "regional-men";

export type ClubOfferTeamSlug = (typeof CLUB_OFFER_TEAM_SLUGS)[number];

export type ClubOfferTeam = {
  slug: ClubOfferTeamSlug;
  shortName: string;
  fullName: string;
  league: string;
  /** Weekday for weekly training, if known. Empty when not announced yet. */
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
  /** Visual accent — men stay Jackals red; D3 Women uses purple. */
  accent: "red" | "purple";
  benefits: string[];
  closingLine: string;
};

export const CLUB_OFFER_COMMITMENT_COPY =
  "I understand that accepting this club offer means joining Jackals Volleyball Club for the season. I commit to paying membership and kit fees on time, showing respect to teammates, coaches, opponents, and officials, attending training and matches with reliability, and representing the club with pride on and off the court.";

export const CLUB_OFFER_TEAMS: Record<ClubOfferTeamSlug, ClubOfferTeam> = {
  "division-2-men": {
    slug: "division-2-men",
    shortName: "Division 2 Men",
    fullName: "Men's Division 2",
    league: "National League",
    trainingNight: "Wednesday",
    venue: "Meakstown",
    heroEyebrow: "Club offer · National League",
    heroTitle: "Club Offer",
    heroHighlight: "Division 2 Men",
    heroSupport:
      "Congratulations — you've been offered a place on Jackals Men's Division 2. Training is Wednesday nights at Meakstown.",
    confirmLabel: "Confirm my Division 2 offer",
    formHeading: "Accept your Division 2 place",
    formSupport:
      "Share your details and preferred kit numbers so we can get you set for the season.",
    accentWord: "NATIONAL",
    accent: "red",
    benefits: [
      "Weekly Wednesday training at Meakstown",
      "Optional extra training in Luttrellstown",
      "Coaching focused on your development",
      "Access to the seamless Jackals training web app",
      "Member pricing on club fun sessions & merch",
      "A hungry team looking to promote to the top",
    ],
    closingLine: "Confirm your place on Division 2 when you're ready.",
  },
  "division-3-women": {
    slug: "division-3-women",
    shortName: "Division 3 Women",
    fullName: "Women's Division 3",
    league: "National League",
    trainingNight: "",
    venue: "Meakstown",
    heroEyebrow: "Club offer · National League",
    heroTitle: "Club Offer",
    heroHighlight: "Division 3 Women",
    heroSupport:
      "Congratulations — you've been offered a place on Jackals Women's Division 3. Weekly training is at Meakstown.",
    confirmLabel: "Confirm my Division 3 offer",
    formHeading: "Accept your Division 3 place",
    formSupport:
      "Share your details and preferred kit numbers so we can get you set for the season.",
    accentWord: "DIVISION",
    accent: "purple",
    benefits: [
      "Weekly training at Meakstown",
      "Optional extra training in Luttrellstown",
      "Coaching focused on your development",
      "Access to the seamless Jackals training web app",
      "Member rates on club fun sessions & merch",
      "A hungry team looking to promote to the top",
    ],
    closingLine: "Confirm your place on Division 3 when you're ready.",
  },
  "division-3-men": {
    slug: "division-3-men",
    shortName: "Division 3 Men",
    fullName: "Men's Division 3",
    league: "National League",
    trainingNight: "",
    venue: "Meakstown",
    heroEyebrow: "Club offer · National League",
    heroTitle: "Club Offer",
    heroHighlight: "Division 3 Men",
    heroSupport:
      "Congratulations — you've been offered a place on Jackals Men's Division 3. Weekly training is at Meakstown.",
    confirmLabel: "Confirm my Division 3 offer",
    formHeading: "Accept your Division 3 place",
    formSupport:
      "Share your details and preferred kit numbers so we can get you set for the season.",
    accentWord: "DIVISION",
    accent: "red",
    benefits: [
      "Weekly training at Meakstown",
      "Optional extra training in Luttrellstown",
      "Coaching focused on your development",
      "Access to the seamless Jackals training web app",
      "Member rates on club fun sessions & merch",
      "A hungry team looking to promote to the top",
    ],
    closingLine: "Confirm your place on Division 3 when you're ready.",
  },
};

export function isClubOfferTeamSlug(value: string): value is ClubOfferTeamSlug {
  return (CLUB_OFFER_TEAM_SLUGS as readonly string[]).includes(value);
}

export function getClubOfferTeam(slug: string): ClubOfferTeam | null {
  const resolved =
    slug === CLUB_OFFER_LEGACY_TEAM_SLUG ? "division-3-men" : slug;
  if (!isClubOfferTeamSlug(resolved)) return null;
  return CLUB_OFFER_TEAMS[resolved];
}

export function clubOfferTeamLabel(slug: string) {
  if (isClubOfferTeamSlug(slug)) return CLUB_OFFER_TEAMS[slug].shortName;
  if (slug === CLUB_OFFER_LEGACY_TEAM_SLUG) return "Division 3 Men";
  return slug;
}
