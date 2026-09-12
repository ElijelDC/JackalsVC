"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { SessionPaymentSection } from "@/components/training/FunSessionJoinFlow";
import { JoinFlowStep } from "@/components/training/JoinFlowStep";
import { PaymentLink } from "@/components/training/PaymentLink";
import { TeamMemberAvatar } from "@/components/teams/TeamMemberCard";
import { TrainingInvitePaymentProofUpload } from "@/components/training/TrainingInvitePaymentProofUpload";
import { IbanTransferDetails } from "@/components/payments/IbanTransferDetails";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageShell";
import { apiGet, apiPost } from "@/lib/client-api";
import { formatEventDateTime } from "@/lib/event-display";
import type { ClubBankDetails } from "@/lib/payments";
import type { PublicTrainingInvite } from "@/lib/training-invite-types";
import {
  TRAINING_INVITE_NEW_RECEIPT_REQUIRED,
  buildTrainingInvitePaymentReference,
  trainingInviteRequiresPaymentProof,
} from "@/lib/training-invite-types";

const STORAGE_PREFIX = "training-invite-registration:";
const GLOBAL_SIGNUP_PROFILE_KEY = "trial-session-signup-profile";
const PAYMENT_PROOF_PREFIX = "training-invite-payment-proof:";

type StoredRegistration = {
  email: string;
  displayName: string;
};

function storageKey(token: string) {
  return `${STORAGE_PREFIX}${token}`;
}

function paymentProofKey(token: string) {
  return `${PAYMENT_PROOF_PREFIX}${token}`;
}

function readGlobalSignupProfile(): StoredRegistration | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(GLOBAL_SIGNUP_PROFILE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredRegistration>;
    if (!parsed.email?.trim()) return null;
    return {
      email: parsed.email.trim().toLowerCase(),
      displayName: parsed.displayName?.trim() ?? "",
    };
  } catch {
    return null;
  }
}

function writeGlobalSignupProfile(profile: StoredRegistration) {
  localStorage.setItem(
    GLOBAL_SIGNUP_PROFILE_KEY,
    JSON.stringify({
      email: profile.email.trim().toLowerCase(),
      displayName: profile.displayName.trim(),
    }),
  );
}

function firstName(name: string) {
  return name.split(" ").filter(Boolean)[0] ?? name;
}

export function TrainingInvitePublicView({
  token,
  initialInvite,
  clubBank,
  initialViewerRegistered,
  initialViewerPendingApproval,
  initialViewerRejected,
}: {
  token: string;
  initialInvite: PublicTrainingInvite;
  clubBank: ClubBankDetails;
  initialViewerRegistered: boolean;
  initialViewerPendingApproval: boolean;
  initialViewerRejected: boolean;
}) {
  const [invite, setInvite] = useState(initialInvite);
  const [form, setForm] = useState({ email: "", displayName: "" });
  const [paymentProofId, setPaymentProofId] = useState<string | null>(null);
  const [viewerRegistered, setViewerRegistered] = useState(
    initialViewerRegistered,
  );
  const [viewerPendingApproval, setViewerPendingApproval] = useState(
    initialViewerPendingApproval,
  );
  const [viewerRejected, setViewerRejected] = useState(initialViewerRejected);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsFreshReceipt, setNeedsFreshReceipt] = useState(false);

  const hasPaymentStep = trainingInviteRequiresPaymentProof(invite);
  const registrationOpen = invite.registrationOpen;

  const attendingPeople = [
    ...invite.squadAttendees.map((person) => ({
      ...person,
      kind: "squad" as const,
    })),
    ...(invite.approvedGuestAttendees ?? []).map((person) => ({
      ...person,
      kind: "guest" as const,
    })),
  ];
  const viewerAttendingKey =
    viewerRegistered && form.displayName.trim()
      ? form.displayName.trim().toLowerCase()
      : null;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey(token));
    const proof = localStorage.getItem(paymentProofKey(token));
    const profile = readGlobalSignupProfile();

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<StoredRegistration>;
        setForm({
          email: parsed.email?.trim().toLowerCase() ?? profile?.email ?? "",
          displayName: parsed.displayName?.trim() ?? profile?.displayName ?? "",
        });
      } catch {
        if (profile) setForm(profile);
      }
    } else if (profile) {
      setForm(profile);
    }

    if (proof?.trim()) setPaymentProofId(proof.trim());
  }, [token]);

  const refreshViewer = useCallback(
    async (email: string) => {
      if (!email.trim()) return;
      const result = await apiGet<{
        invite: PublicTrainingInvite;
        viewerRegistered: boolean;
        viewerPendingApproval: boolean;
        viewerRejected: boolean;
        viewerDisplayName: string | null;
        viewerPaymentProofId: string | null;
      }>(
        `/api/training-invites/${token}?email=${encodeURIComponent(email)}`,
        "Could not refresh invite status",
      );
      if (!result.ok) return;
      setInvite(result.data.invite);
      setViewerRegistered(result.data.viewerRegistered);
      setViewerPendingApproval(result.data.viewerPendingApproval);
      setViewerRejected(result.data.viewerRejected);
      if (result.data.viewerDisplayName) {
        setForm((current) => ({
          ...current,
          displayName: result.data.viewerDisplayName ?? current.displayName,
        }));
      }
      if (result.data.viewerPaymentProofId) {
        setPaymentProofId(result.data.viewerPaymentProofId);
        localStorage.setItem(
          paymentProofKey(token),
          result.data.viewerPaymentProofId,
        );
      }
    },
    [token],
  );

  useEffect(() => {
    if (form.email.trim()) {
      void refreshViewer(form.email);
    }
  }, [form.email, refreshViewer]);

  const handlePaymentProofChange = (proofId: string | null) => {
    setPaymentProofId(proofId);
    setNeedsFreshReceipt(false);
    if (proofId) {
      localStorage.setItem(paymentProofKey(token), proofId);
    } else {
      localStorage.removeItem(paymentProofKey(token));
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      email: form.email.trim().toLowerCase(),
      displayName: form.displayName.trim(),
      ...(hasPaymentStep && paymentProofId
        ? { paymentProofId }
        : {}),
    };

    const result = await apiPost<{
      message: string;
      signup: { id: string; displayName: string; status: string };
    }>(`/api/training-invites/${token}/signup`, payload, "Could not register");

    setLoading(false);

    if (!result.ok) {
      if (
        result.error === TRAINING_INVITE_NEW_RECEIPT_REQUIRED ||
        result.error.toLowerCase().includes("receipt")
      ) {
        setNeedsFreshReceipt(true);
      }
      setError(result.error);
      return;
    }

    writeGlobalSignupProfile(payload);
    localStorage.setItem(storageKey(token), JSON.stringify(payload));
    setSuccess(result.data.message);
    setViewerRejected(false);
    setViewerPendingApproval(true);
    setViewerRegistered(false);
    await refreshViewer(payload.email);
  };

  const { dateLabel, timeLabel } = formatEventDateTime(
    invite.startDate,
    invite.endDate,
  );

  const canRegister =
    registrationOpen &&
    !viewerRegistered &&
    !viewerPendingApproval &&
    (!hasPaymentStep || Boolean(paymentProofId));

  return (
    <PageContainer>
      <AnimateIn immediate>
        <div className="mb-8 overflow-hidden border border-jackals-red/25 bg-gradient-to-br from-jackals-red/15 via-jackals-surface to-jackals-surface">
          <div className="border-b border-jackals-red/20 px-6 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
              <CalendarDays className="h-3.5 w-3.5" />
              {invite.teamName ?? "Training invite"}
            </div>
          </div>
          <div className="px-6 py-6">
            <h1 className="font-display text-2xl font-semibold text-white">
              {invite.title}
            </h1>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Clock className="h-4 w-4 shrink-0 text-jackals-red-light" />
                {dateLabel} · {timeLabel}
              </div>
              {invite.location && (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <MapPin className="h-4 w-4 shrink-0 text-jackals-red-light" />
                  {invite.location}
                </div>
              )}
              {invite.coachName && (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <GraduationCap className="h-4 w-4 shrink-0 text-jackals-red-light" />
                  Coach {invite.coachName}
                </div>
              )}
            </div>
            {invite.description && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-500">
                {invite.description}
              </p>
            )}
          </div>
        </div>
      </AnimateIn>

      <div className="grid gap-6 lg:grid-cols-5">
        <AnimateIn immediate className="lg:col-span-2">
          <Card>
            <CardTitle className="text-base">How to join</CardTitle>
            <CardDescription className="mt-2">
              {registrationOpen
                ? hasPaymentStep
                  ? "Pay, upload your receipt, then submit your details for coach approval."
                  : "Submit your details for coach approval."
                : "Registration is closed for this invite."}
            </CardDescription>

            <div className="mt-6">
              {hasPaymentStep && invite.sessionFeeEur != null && (
                <JoinFlowStep step={1} title="Pay session fee">
                  <div className="space-y-4">
                    <IbanTransferDetails
                      accountHolder={clubBank.accountHolder}
                      iban={clubBank.iban}
                      accountLabel={clubBank.accountLabel}
                      paymentReference={buildTrainingInvitePaymentReference(
                        form.displayName,
                        invite.startDate,
                      )}
                      amount={invite.sessionFeeEur}
                    />
                    {invite.paymentUrl ? (
                      <PaymentLink
                        href={invite.paymentUrl}
                        label="Open payment link"
                      />
                    ) : null}
                  </div>
                </JoinFlowStep>
              )}

              {hasPaymentStep &&
                invite.sessionFeeEur == null &&
                invite.paymentUrl && (
                  <JoinFlowStep step={1} title="Pay session fee">
                    <SessionPaymentSection
                      paymentUrl={invite.paymentUrl}
                      payLabel="Payment link"
                      showInstructions={false}
                    />
                  </JoinFlowStep>
                )}

              {hasPaymentStep && (
                <JoinFlowStep
                  step={invite.paymentUrl || invite.sessionFeeEur != null ? 2 : 1}
                  title={
                    needsFreshReceipt
                      ? "Upload a new payment receipt"
                      : "Upload payment receipt"
                  }
                >
                  <TrainingInvitePaymentProofUpload
                    token={token}
                    proofId={paymentProofId}
                    onProofChange={handlePaymentProofChange}
                    forceReupload={needsFreshReceipt && !paymentProofId}
                    forceReuploadMessage={
                      viewerRejected
                        ? "Your previous receipt cannot be reused. Upload a new screenshot, then submit again."
                        : TRAINING_INVITE_NEW_RECEIPT_REQUIRED
                    }
                  />
                </JoinFlowStep>
              )}

              {registrationOpen && (
                <JoinFlowStep
                  step={hasPaymentStep ? 3 : 1}
                  title={
                    viewerRegistered
                      ? "You're confirmed"
                      : viewerPendingApproval
                        ? "Awaiting approval"
                        : viewerRejected
                          ? "Request not approved"
                          : "Submit your details"
                  }
                  isLast
                >
                  {viewerRegistered ? (
                    <div className="mb-4 space-y-3">
                      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                          <div>
                            <p className="font-semibold text-emerald-50">
                              You&apos;re confirmed for this session
                            </p>
                            <p className="mt-1 text-emerald-100/85">
                              A coach approved your request
                              {form.displayName.trim()
                                ? ` — you're listed as ${form.displayName.trim()} in Who's attending`
                                : " — you're on the attending list"}
                              .
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : viewerPendingApproval ? (
                    <p className="mb-4 text-sm text-zinc-400">
                      Your request has been submitted. A coach will review it
                      soon.
                    </p>
                  ) : viewerRejected ? (
                    <p className="mb-4 text-sm text-zinc-400">
                      {hasPaymentStep
                        ? "Upload a new payment receipt above, then submit again below."
                        : "You can submit again below if you'd still like to join."}
                    </p>
                  ) : (
                    <p className="mb-4 text-sm text-zinc-400">
                      Enter your email and the name you&apos;d like coaches to
                      see.
                    </p>
                  )}

                  <form className="space-y-4" onSubmit={(e) => void submit(e)}>
                    <div>
                      <Label htmlFor="invite-email">Email</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            email: event.target.value,
                          }))
                        }
                        disabled={viewerRegistered || viewerPendingApproval}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="invite-name">Display name</Label>
                      <Input
                        id="invite-name"
                        value={form.displayName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            displayName: event.target.value,
                          }))
                        }
                        disabled={viewerRegistered}
                        required
                      />
                    </div>
                    <FormError message={error} />
                    <SuccessBanner message={success} />
                    {!viewerRegistered && !viewerPendingApproval && (
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading || !canRegister}
                      >
                        {loading ? "Submitting..." : "Submit for approval"}
                      </Button>
                    )}
                  </form>
                </JoinFlowStep>
              )}

              {!registrationOpen && (
                <div className="rounded-lg border border-zinc-500/30 bg-zinc-500/10 px-4 py-3 text-sm text-zinc-300">
                  This invite is closed.
                </div>
              )}

              {viewerPendingApproval && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  Request submitted — waiting for coach approval.
                </div>
              )}
            </div>
          </Card>
        </AnimateIn>

        <AnimateIn immediate className="lg:col-span-3">
          <Card>
            <CardTitle className="text-base">Who&apos;s attending</CardTitle>
            <CardDescription className="mt-2">
              Squad members and approved guests for this session.
            </CardDescription>
            <div className="mt-6">
              {attendingPeople.length === 0 ? (
                <p className="text-sm text-zinc-600">
                  No one attending yet.
                </p>
              ) : (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-x-2 gap-y-4">
                  {attendingPeople.map((attendee) => {
                    const isYou =
                      viewerAttendingKey !== null &&
                      attendee.displayName.trim().toLowerCase() ===
                        viewerAttendingKey;
                    return (
                      <li
                        key={`${attendee.kind}-${attendee.id}`}
                        className="flex min-w-0 flex-col items-center gap-1.5 text-center"
                      >
                        <TeamMemberAvatar
                          name={attendee.displayName}
                          className={
                            isYou
                              ? "h-10 w-10 ring-2 ring-jackals-red/70"
                              : "h-10 w-10 ring-2 ring-green-500/35"
                          }
                        />
                        <span
                          className="w-full truncate text-[11px] font-medium leading-tight text-zinc-400"
                          title={attendee.displayName}
                        >
                          {isYou ? "You" : firstName(attendee.displayName)}
                        </span>
                        {attendee.kind === "guest" && !isYou ? (
                          <span className="text-[10px] text-zinc-600">Guest</span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </AnimateIn>
      </div>
    </PageContainer>
  );
}
