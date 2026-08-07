"use client";

import { OfferDeclineForm } from "@/components/offers/OfferDeclineForm";
import type { ClubOfferTeam } from "@/lib/club-offer-config";

type ClubOfferDeclineFormProps = {
  team: ClubOfferTeam;
  onCancel: () => void;
};

export function ClubOfferDeclineForm({
  team,
  onCancel,
}: ClubOfferDeclineFormProps) {
  return (
    <OfferDeclineForm
      teamSlug={team.slug}
      teamShortName={team.shortName}
      apiPath="/api/club-offer-decline"
      idPrefix="club-offer-decline"
      intro={`Let us know you won't be taking up this Club Offer for ${team.shortName}. Name and email are enough.`}
      successFooter={`Thanks for responding about ${team.shortName}. No further action is needed from you.`}
      onCancel={onCancel}
    />
  );
}
