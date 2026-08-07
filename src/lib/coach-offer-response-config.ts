import {
  COACH_OFFER_TEAMS,
  coachOfferTeamLabel,
  type CoachOfferTeamSlug,
} from "@/lib/coach-offer-config";
import {
  OFFER_RESPONSE_STATUSES,
  type OfferResponseStatus,
} from "@/lib/offer-response-shared";

export const COACH_OFFER_RESPONSE_STATUSES = OFFER_RESPONSE_STATUSES;
export type CoachOfferResponseStatus = OfferResponseStatus;

export type CoachOfferResponseRecord = {
  id: string;
  teamSlug: CoachOfferTeamSlug | string;
  teamLabel: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  poloMaterial: string;
  poloSize: string;
  commitmentAccepted: boolean;
  signatureDataUrl: string;
  status: CoachOfferResponseStatus | string;
  createdAt: string;
};

export function serializeCoachOfferResponse(row: {
  id: string;
  teamSlug: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  poloMaterial: string;
  poloSize: string;
  commitmentAccepted: boolean;
  signatureDataUrl: string;
  status: string;
  createdAt: Date;
}): CoachOfferResponseRecord {
  const teamLabel =
    row.teamSlug in COACH_OFFER_TEAMS
      ? coachOfferTeamLabel(row.teamSlug as CoachOfferTeamSlug)
      : row.teamSlug;

  return {
    id: row.id,
    teamSlug: row.teamSlug,
    teamLabel,
    fullName: row.fullName,
    phoneNumber: row.phoneNumber,
    email: row.email,
    poloMaterial: row.poloMaterial,
    poloSize: row.poloSize,
    commitmentAccepted: row.commitmentAccepted,
    signatureDataUrl: row.signatureDataUrl,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
