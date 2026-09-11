"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Loader2, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FormError } from "@/components/ui/FormMessage";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/client-api";
import type {
  TrainingInvitePricingType,
  TrainingInviteSignupRecord,
} from "@/lib/training-invite-types";
import { TRAINING_INVITE_SIGNUP_STATUS_LABELS } from "@/lib/training-invite-types";
import { cn } from "@/lib/utils";

type InviteWithSignups = {
  id: string;
  token: string;
  eventId: string;
  pricingType: TrainingInvitePricingType;
  sessionFeeEur: number | null;
  paymentUrl: string | null;
  status: string;
  createdAt: string;
  publicPath: string;
  signups: TrainingInviteSignupRecord[];
  pendingCount: number;
  approvedCount: number;
};

function absoluteInviteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function statusClass(status: string) {
  if (status === "APPROVED") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (status === "REJECTED") return "border-rose-500/40 bg-rose-500/10 text-rose-300";
  return "border-amber-500/40 bg-amber-500/10 text-amber-200";
}

export function CoachTrainingInvitePanel({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [invites, setInvites] = useState<InviteWithSignups[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyType, setBusyType] = useState<TrainingInvitePricingType | null>(
    null,
  );
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<TrainingInvitePricingType | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await apiGet<{ invites: InviteWithSignups[] }>(
      `/api/coach/training/invites?eventId=${encodeURIComponent(eventId)}`,
      "Could not load invites",
    );
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInvites(result.data.invites);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const ensureInvite = async (
    pricingType: TrainingInvitePricingType,
    regenerate = false,
  ) => {
    setBusyType(pricingType);
    setError(null);
    const result = await apiPost<{
      invite: InviteWithSignups;
      created: boolean;
    }>(
      "/api/coach/training/invites",
      { eventId, pricingType, regenerate },
      "Could not create invite",
    );
    setBusyType(null);
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    await load();
    return result.data.invite;
  };

  const copyLink = async (pricingType: TrainingInvitePricingType) => {
    let invite: InviteWithSignups | undefined = invites.find(
      (item) => item.pricingType === pricingType,
    );
    if (!invite) {
      const created = await ensureInvite(pricingType);
      if (!created) return;
      invite = created;
    }

    try {
      await navigator.clipboard.writeText(absoluteInviteUrl(invite.publicPath));
      setCopiedType(pricingType);
      window.setTimeout(() => setCopiedType(null), 1800);
    } catch {
      setError("Could not copy link. Generate it again and copy manually.");
    }
  };

  const reviewSignup = async (
    signupId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    setReviewingId(signupId);
    setError(null);
    const result = await apiPatch<{ signup: TrainingInviteSignupRecord }>(
      `/api/coach/training/invites/signups/${signupId}`,
      { status },
      "Could not update registration",
    );
    setReviewingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
    router.refresh();
  };

  const removeSignup = async (signupId: string) => {
    setReviewingId(signupId);
    setError(null);
    const result = await apiDelete(
      `/api/coach/training/invites/signups/${signupId}`,
      "Could not remove guest",
    );
    setReviewingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    await load();
    router.refresh();
  };

  const allSignups = invites
    .flatMap((invite) => invite.signups)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const paidInvite = invites.find((invite) => invite.pricingType === "PAID");
  const freeInvite = invites.find((invite) => invite.pricingType === "FREE");

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-jackals-red/15 text-jackals-red-light">
          <UserPlus className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">Guest invites</CardTitle>
          <CardDescription className="mt-1">
            Invite players not on this squad to this training session. Paid
            invites use the same €
            {paidInvite?.sessionFeeEur ?? 10} Pay Per Training fee.
          </CardDescription>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(
          [
            { type: "PAID" as const, label: "Paid invite (€10)", invite: paidInvite },
            { type: "FREE" as const, label: "Free invite", invite: freeInvite },
          ] as const
        ).map(({ type, label, invite }) => (
          <div
            key={type}
            className="rounded-lg border border-white/10 bg-black/20 p-3"
          >
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="mt-1 truncate text-xs text-zinc-500">
              {invite
                ? absoluteInviteUrl(invite.publicPath)
                : "No link yet — generate to copy."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="primary"
                disabled={busyType === type}
                onClick={() => void copyLink(type)}
              >
                {busyType === type ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : copiedType === type ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copiedType === type ? "Copied" : invite ? "Copy link" : "Create & copy"}
              </Button>
              {invite ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busyType === type}
                  onClick={() => void ensureInvite(type, true)}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  New link
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <FormError message={error} />

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Invitees ({allSignups.length})
        </p>
        {loading ? (
          <p className="mt-3 text-sm text-zinc-500">Loading…</p>
        ) : allSignups.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">No guest registrations yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {allSignups.map((signup) => (
              <li
                key={signup.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">{signup.displayName}</p>
                    <Badge className={cn("text-[10px]", statusClass(signup.status))}>
                      {TRAINING_INVITE_SIGNUP_STATUS_LABELS[signup.status]}
                    </Badge>
                    <Badge className="border-white/10 bg-white/5 text-[10px] text-zinc-400">
                      {signup.pricingType === "PAID" ? "Paid" : "Free"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{signup.email}</p>
                  {signup.paymentProofUrl ? (
                    <a
                      href={signup.paymentProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-jackals-red-light hover:underline"
                    >
                      View receipt
                    </a>
                  ) : null}
                </div>
                {signup.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={reviewingId === signup.id}
                      onClick={() => void reviewSignup(signup.id, "APPROVED")}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={reviewingId === signup.id}
                      onClick={() => void reviewSignup(signup.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label={`Remove ${signup.displayName}`}
                    disabled={reviewingId === signup.id}
                    onClick={() => void removeSignup(signup.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-200 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
