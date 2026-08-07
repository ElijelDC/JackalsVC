"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Label } from "@/components/ui/Input";
import { apiPost } from "@/lib/client-api";

type OfferDeclineFormProps = {
  teamSlug: string;
  teamShortName: string;
  apiPath: string;
  idPrefix: string;
  intro: string;
  successFooter: string;
  onCancel: () => void;
};

export function OfferDeclineForm({
  teamSlug,
  teamShortName,
  apiPath,
  idPrefix,
  intro,
  successFooter,
  onCancel,
}: OfferDeclineFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = await apiPost<{ success: boolean; message: string }>(
      apiPath,
      {
        teamSlug,
        fullName,
        email,
        phoneNumber: phoneNumber.trim() || undefined,
      },
      "We couldn't submit your response. Please try again.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(
      result.data.message ||
        "Offer declined — thanks for letting us know. We've notified the club.",
    );
  };

  if (success) {
    return (
      <div className="border border-white/15 bg-white/[0.03] px-5 py-6 text-center">
        <p className="font-display text-2xl font-bold uppercase tracking-[0.08em] text-white">
          Offer declined
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{success}</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {successFooter}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormError message={error} />

      <p className="text-sm leading-relaxed text-zinc-400">{intro}</p>

      <div>
        <Label htmlFor={`${idPrefix}-full-name`}>Full name</Label>
        <Input
          id={`${idPrefix}-full-name`}
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
          <Label htmlFor={`${idPrefix}-email`}>Email</Label>
          <Input
            id={`${idPrefix}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-phone`}>
            Phone number{" "}
            <span className="font-normal text-zinc-500">(optional)</span>
          </Label>
          <Input
            id={`${idPrefix}-phone`}
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="submit"
          size="lg"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={loading}
        >
          {loading ? "Submitting…" : "Confirm decline"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          className="w-full sm:w-auto"
          disabled={loading}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
