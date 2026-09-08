import type { LucideIcon } from "lucide-react";
import {
  Baby,
  CalendarHeart,
  Camera,
  HeartHandshake,
  Megaphone,
  NotebookPen,
  Package,
  Palette,
  Share2,
  UsersRound,
  Wallet,
} from "lucide-react";

export const COMMITTEE_ROLE_VALUES = [
  "EQUIPMENT_OFFICER",
  "VOLUNTEER_COORDINATOR",
  "PLAYER_WELFARE_OFFICER",
  "CHILDRENS_OFFICER",
  "SOCIAL_MEDIA_OFFICER",
  "GFX_DESIGNER",
  "CLUB_ANNOUNCEMENTS_LEAD",
  "EVENTS_OFFICER",
  "PHOTO_OFFICER",
  "MEMBERSHIP_OFFICER",
  "SECRETARY",
] as const;

export type CommitteeRoleValue = (typeof COMMITTEE_ROLE_VALUES)[number];

export type CommitteeRole = {
  value: CommitteeRoleValue;
  title: string;
  summary: string;
  tasks: string[];
  icon: LucideIcon;
};

export const COMMITTEE_ROLES: CommitteeRole[] = [
  {
    value: "EQUIPMENT_OFFICER",
    title: "Equipment Officer",
    summary: "Balls, nets, gear checks — help set up the hall on home days.",
    icon: Package,
    tasks: [
      "Keep a simple count of club balls (match + training).",
      "Check nets, antennae, posts, and scoreboard are usable.",
      "Flag damaged or worn kit early so it can be replaced before a home day.",
      "Help set up the hall on home matchdays.",
      "Tell the committee what needs buying or repairing.",
    ],
  },
  {
    value: "VOLUNTEER_COORDINATOR",
    title: "Volunteer Coordinator",
    summary:
      "Scorers, linespeople, and helpers for home games and big club days.",
    icon: UsersRound,
    tasks: [
      "Before each home matchday, fill scorers and linespeople (and other helpers).",
      "Share a clear rota / WhatsApp ask so people know times and roles.",
      "Cover last-minute dropouts where possible.",
      "Work with Equipment and Events so setup and staffing aren’t left to one person.",
    ],
  },
  {
    value: "PLAYER_WELFARE_OFFICER",
    title: "Player Welfare Officer",
    summary: "First contact for players with club issues.",
    icon: HeartHandshake,
    tasks: [
      "Be a clear, approachable point of contact for players with club issues.",
      "Listen and escalate to the committee when needed.",
      "Keep conversations respectful and confidential where appropriate.",
      "Signpost U18 concerns to the Children’s Officer.",
      "Help new or quieter players feel they have someone to talk to.",
    ],
  },
  {
    value: "CHILDRENS_OFFICER",
    title: "Children’s Officer",
    summary: "First contact for U18 / parent concerns.",
    icon: Baby,
    tasks: [
      "Be the named contact for any U18 or parent concerns.",
      "Make sure U18 processes the club needs are followed.",
      "Keep a simple list of U18 players and parent/guardian contacts if used.",
      "Escalate serious concerns through the proper safeguarding route.",
      "Work with coaches and Player Welfare so under-18s are looked after properly.",
    ],
  },
  {
    value: "SOCIAL_MEDIA_OFFICER",
    title: "Social Media Officer",
    summary: "Post on Instagram and club social pages.",
    icon: Share2,
    tasks: [
      "Post regularly on club social pages (results, fixtures, events, recruitment).",
      "Use graphics from GFX Designer so posts look consistent.",
      "Use photos from Photo Officer when available.",
      "Keep tone friendly and on-brand.",
      "Coordinate big announcements with Club Announcements Lead.",
    ],
  },
  {
    value: "GFX_DESIGNER",
    title: "GFX Designer",
    summary:
      "Canva Pro graphics — keep the Jackals look consistent (can build a small design team).",
    icon: Palette,
    tasks: [
      "Create social and promo graphics in Canva Pro.",
      "Keep colours, fonts, logo use, and layout consistent across Jackals posts.",
      "Build and maintain simple reusable templates.",
      "Supply finished assets to Social Media Officer on time.",
      "Support Events / Sponsors / Merch graphics when asked.",
      "Optional: coordinate a small design team within the club.",
    ],
  },
  {
    value: "CLUB_ANNOUNCEMENTS_LEAD",
    title: "Club Announcements Lead",
    summary: "WhatsApp updates for merch, sponsors, events, and club news.",
    icon: Megaphone,
    tasks: [
      "Post clear WhatsApp updates for players.",
      "Collect info from other officers before posting.",
      "Keep messages short, timed, and accurate.",
      "Avoid spam; batch updates when it makes sense.",
      "Point people to the right officer if they reply with questions.",
    ],
  },
  {
    value: "EVENTS_OFFICER",
    title: "Events Officer",
    summary: "Plan socials and club nights; pass details to Announcements.",
    icon: CalendarHeart,
    tasks: [
      "Plan club socials and club nights (venue, date, rough budget, who’s invited).",
      "Coordinate helpers with Volunteer Coordinator if staffing is needed.",
      "Pass confirmed event details to Announcements and Social Media.",
      "Ask GFX Designer for event graphics when needed.",
      "After the event, note what worked for next time.",
    ],
  },
  {
    value: "PHOTO_OFFICER",
    title: "Photo Officer",
    summary: "Matchday and training photos for Socials and GFX Designer.",
    icon: Camera,
    tasks: [
      "Take photos at matchdays and (when useful) training / events.",
      "Share usable photos promptly with Social Media and GFX Designer.",
      "Aim for a mix: action, team, setup, people.",
      "Respect privacy (especially U18s / anyone who asks not to be posted).",
      "Keep a simple shared folder so posts aren’t blocked waiting for images.",
    ],
  },
  {
    value: "MEMBERSHIP_OFFICER",
    title: "Membership Officer",
    summary: "Remind members to pay; use the website to see who’s due / unpaid.",
    icon: Wallet,
    tasks: [
      "Remind members to pay membership on time.",
      "Use the club website account to see who is due / unpaid.",
      "Send polite chase messages without public shaming.",
      "Flag long-overdue cases to the Treasurer / committee.",
      "Keep the committee updated on payment progress.",
    ],
  },
  {
    value: "SECRETARY",
    title: "Secretary",
    summary:
      "Committee meetings, minutes, and club correspondence / records.",
    icon: NotebookPen,
    tasks: [
      "Organise committee meetings (date, agenda, and invites).",
      "Take clear minutes and share them with the committee after meetings.",
      "Keep simple club records in order (contacts, role holders, key docs).",
      "Handle or forward official club correspondence when needed.",
      "Support AGM / EGM prep (notices, agenda, attendance notes).",
    ],
  },
];

export const COMMITTEE_ROLE_LABELS: Record<CommitteeRoleValue, string> =
  Object.fromEntries(
    COMMITTEE_ROLES.map((role) => [role.value, role.title]),
  ) as Record<CommitteeRoleValue, string>;

export function committeeRoleLabel(value: string) {
  return (
    COMMITTEE_ROLE_LABELS[value as CommitteeRoleValue] ?? value
  );
}

export const COMMITTEE_INTEREST_STATUSES = [
  "NEW",
  "REVIEWED",
  "DISMISSED",
] as const;

export type CommitteeInterestStatus =
  (typeof COMMITTEE_INTEREST_STATUSES)[number];

export const COMMITTEE_INTEREST_STATUS_LABELS: Record<
  CommitteeInterestStatus,
  string
> = {
  NEW: "New",
  REVIEWED: "Reviewed",
  DISMISSED: "Dismissed",
};

export function isCommitteeInterestStatus(
  value: string,
): value is CommitteeInterestStatus {
  return (COMMITTEE_INTEREST_STATUSES as readonly string[]).includes(value);
}

export type CommitteeInterestRecord = {
  id: string;
  fullName: string;
  roleInterest1: string;
  roleInterest2: string;
  roleInterest3: string;
  status: CommitteeInterestStatus;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeCommitteeInterest(interest: {
  id: string;
  fullName: string;
  roleInterest1: string;
  roleInterest2: string;
  roleInterest3: string;
  status: string;
  reviewedAt: Date | null;
  reviewedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CommitteeInterestRecord {
  return {
    id: interest.id,
    fullName: interest.fullName,
    roleInterest1: interest.roleInterest1,
    roleInterest2: interest.roleInterest2,
    roleInterest3: interest.roleInterest3,
    status: isCommitteeInterestStatus(interest.status)
      ? interest.status
      : "NEW",
    reviewedAt: interest.reviewedAt?.toISOString() ?? null,
    reviewedByUserId: interest.reviewedByUserId,
    createdAt: interest.createdAt.toISOString(),
    updatedAt: interest.updatedAt.toISOString(),
  };
}
