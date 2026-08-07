import {
  CLUB_OFFER_TEAMS,
  clubOfferTeamLabel,
  type ClubOfferTeamSlug,
} from "@/lib/club-offer-config";
import {
  OFFER_RESPONSE_STATUSES,
  type OfferResponseStatus,
} from "@/lib/offer-response-shared";

export const CLUB_OFFER_RESPONSE_STATUSES = OFFER_RESPONSE_STATUSES;
export type ClubOfferResponseStatus = OfferResponseStatus;

export type ClubOfferResponseRecord = {
  id: string;
  teamSlug: ClubOfferTeamSlug | string;
  teamLabel: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  preferredKitNumber1: number | null;
  preferredKitNumber2: number | null;
  commitmentAccepted: boolean;
  signatureDataUrl: string;
  status: ClubOfferResponseStatus | string;
  createdAt: string;
};

export function serializeClubOfferResponse(row: {
  id: string;
  teamSlug: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  preferredKitNumber1: number | null;
  preferredKitNumber2: number | null;
  commitmentAccepted: boolean;
  signatureDataUrl: string;
  status: string;
  createdAt: Date;
}): ClubOfferResponseRecord {
  const teamLabel =
    row.teamSlug in CLUB_OFFER_TEAMS
      ? clubOfferTeamLabel(row.teamSlug as ClubOfferTeamSlug)
      : row.teamSlug;

  return {
    id: row.id,
    teamSlug: row.teamSlug,
    teamLabel,
    fullName: row.fullName,
    phoneNumber: row.phoneNumber,
    email: row.email,
    preferredKitNumber1: row.preferredKitNumber1,
    preferredKitNumber2: row.preferredKitNumber2,
    commitmentAccepted: row.commitmentAccepted,
    signatureDataUrl: row.signatureDataUrl,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}
