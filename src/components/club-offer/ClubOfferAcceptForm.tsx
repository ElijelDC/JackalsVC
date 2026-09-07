"use client";

import { useState } from "react";
import { ClubOfferConfetti } from "@/components/club-offer/ClubOfferConfetti";
import { SignaturePad } from "@/components/club-offer/SignaturePad";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Checkbox, Input, Label } from "@/components/ui/Input";
import {
  CLUB_OFFER_COMMITMENT_COPY,
  type ClubOfferTeam,
} from "@/lib/club-offer-config";
import { apiPost } from "@/lib/client-api";

type ClubOfferAcceptFormProps = {
  team: ClubOfferTeam;
};

export function ClubOfferAcceptForm({ team }: ClubOfferAcceptFormProps) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [commitmentAccepted, setCommitmentAccepted] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = await apiPost<{ success: boolean; message: string }>(
      "/api/club-offer-acceptance",
      {
        teamSlug: team.slug,
        fullName,
        phoneNumber,
        email,
        commitmentAccepted,
        signatureDataUrl,
      },
      "We couldn't submit your acceptance. Please try again.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(
      result.data.message ||
        "Offer accepted — thanks. The club will be in touch with next steps.",
    );
  };

  if (success) {
    return (
      <div className="relative space-y-4 overflow-visible pt-4">
        <ClubOfferConfetti accent={team.accent} />
        <div
          className={
            team.accent === "purple"
              ? "border border-jackals-purple/35 bg-jackals-purple/15 px-5 py-6 text-center shadow-[0_0_40px_rgba(147,51,234,0.25)]"
              : "border border-jackals-red/35 bg-jackals-red/15 px-5 py-6 text-center shadow-[0_0_40px_rgba(232,34,42,0.28)]"
          }
        >
          <p className="font-display text-2xl font-bold uppercase tracking-[0.08em] text-white">
            Offer accepted
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300">
            {success}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Your acceptance for {team.shortName} has been received. We&apos;ll
            follow up by email with membership and training details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormError message={error} />

      <div>
        <Label htmlFor="club-offer-full-name">Full name</Label>
        <Input
          id="club-offer-full-name"
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="club-offer-phone">Phone number</Label>
          <Input
            id="club-offer-phone"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="club-offer-email">Email</Label>
          <Input
            id="club-offer-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-sm border border-white/10 bg-white/[0.02] p-4">
        <Checkbox
          className="mt-1 shrink-0"
          checked={commitmentAccepted}
          onChange={(event) => setCommitmentAccepted(event.target.checked)}
          disabled={loading}
          required
        />
        <span className="text-sm leading-relaxed text-zinc-300">
          {CLUB_OFFER_COMMITMENT_COPY}
        </span>
      </label>

      <div>
        <Label>Signature</Label>
        <SignaturePad
          value={signatureDataUrl}
          onChange={setSignatureDataUrl}
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className={
          team.accent === "purple"
            ? "w-full bg-jackals-purple shadow-[0_0_28px_rgba(147,51,234,0.4)] hover:bg-jackals-purple-hover sm:w-auto"
            : "w-full shadow-[0_0_28px_rgba(232,34,42,0.45)] sm:w-auto"
        }
        disabled={loading}
      >
        {loading ? "Submitting…" : "Submit acceptance"}
      </Button>
    </form>
  );
}
