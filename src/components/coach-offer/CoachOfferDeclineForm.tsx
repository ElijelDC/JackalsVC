"use client";

import { OfferDeclineForm } from "@/components/offers/OfferDeclineForm";
import type { CoachOfferTeam } from "@/lib/coach-offer-config";

type CoachOfferDeclineFormProps = {
  team: CoachOfferTeam;
  onCancel: () => void;
};

export function CoachOfferDeclineForm({
  team,
  onCancel,
}: CoachOfferDeclineFormProps) {
  return (
    <OfferDeclineForm
      teamSlug={team.slug}
      teamShortName={team.shortName}
      apiPath="/api/coach-offer-decline"
      idPrefix="coach-offer-decline"
      intro={`Let us know you won't be taking up this Coach Offer for ${team.shortName}. Name and email are enough.`}
      successFooter={`Thanks for responding about coaching ${team.shortName}. No further action is needed from you.`}
      onCancel={onCancel}
    />
  );
}
