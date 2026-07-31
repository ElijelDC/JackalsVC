"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
} from "lucide-react";
import {
  SessionPaymentSection,
} from "@/components/training/FunSessionJoinFlow";
import { EntryFeeBadge, JoinFlowStep } from "@/components/training/JoinFlowStep";
import { TeamMemberAvatar } from "@/components/teams/TeamMemberCard";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import { Input, Label } from "@/components/ui/Input";
import { PageContainer } from "@/components/layout/PageShell";
import { apiGet, apiPatch, apiPost } from "@/lib/client-api";
import { formatEventDateTime } from "@/lib/event-display";
import type { PublicTrialSession } from "@/lib/trial-session-types";
import { cn } from "@/lib/utils";

type TrialSessionPublicViewProps = {
  slug: string;
  initialSession: PublicTrialSession;
  initialViewerRegistered: boolean;
};

const STORAGE_PREFIX = "trial-session-registration:";
const PAYMENT_CLICKED_PREFIX = "trial-session-payment-clicked:";

function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

function paymentClickedKey(slug: string) {
  return `${PAYMENT_CLICKED_PREFIX}${slug}`;
}

function readPaymentLinkClicked(slug: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(paymentClickedKey(slug)) === "1";
}

function writePaymentLinkClicked(slug: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(paymentClickedKey(slug), "1");
}

type StoredRegistration = {
  email: string;
  displayName: string;
};

function readStoredRegistration(slug: string): StoredRegistration | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(storageKey(slug));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredRegistration>;
    if (!parsed.email?.trim()) return null;
    return {
      email: parsed.email.trim().toLowerCase(),
      displayName: parsed.displayName?.trim() ?? "",
    };
  } catch {
    const legacyEmail = raw.trim().toLowerCase();
    return legacyEmail ? { email: legacyEmail, displayName: "" } : null;
  }
}

function writeStoredRegistration(slug: string, registration: StoredRegistration) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    storageKey(slug),
    JSON.stringify({
      email: registration.email.trim().toLowerCase(),
      displayName: registration.displayName.trim(),
    }),
  );
}

function firstName(name: string) {
  return name.split(" ").filter(Boolean)[0] ?? name;
}

export function TrialSessionPublicView({
  slug,
  initialSession,
  initialViewerRegistered,
}: TrialSessionPublicViewProps) {
  const [session, setSession] = useState(initialSession);
  const [viewerRegistered, setViewerRegistered] = useState(initialViewerRegistered);
  const [form, setForm] = useState({ email: "", displayName: "" });
  const [duplicatePrompt, setDuplicatePrompt] = useState(false);
  const [paymentLinkClicked, setPaymentLinkClicked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const eventDate = useMemo(() => new Date(session.startDate), [session.startDate]);
  const past = eventDate < new Date();
  const { timeLabel } = formatEventDateTime(session.startDate, session.endDate);
  const hasPaymentStep =
    Boolean(session.paymentUrl || session.sessionFee != null) && !past;
  const registerStep = hasPaymentStep ? 2 : 1;
  const requiresPaymentClick =
    Boolean(session.paymentUrl) && hasPaymentStep && !past;
  const canRegister =
    !requiresPaymentClick ||
    paymentLinkClicked ||
    viewerRegistered ||
    duplicatePrompt;

  const markPaymentLinkClicked = useCallback(() => {
    writePaymentLinkClicked(slug);
    setPaymentLinkClicked(true);
  }, [slug]);

  const refreshSession = useCallback(
    async (email?: string) => {
      const query = email ? `?email=${encodeURIComponent(email)}` : "";
      const result = await apiGet<{
        session: PublicTrialSession;
        viewerRegistered: boolean;
        viewerDisplayName: string | null;
      }>(`/api/trial-sessions/${slug}${query}`);

      if (!result.ok) return null;

      setSession(result.data.session);
      setViewerRegistered(result.data.viewerRegistered);

      if (email && result.data.viewerDisplayName) {
        setForm({
          email: email.trim().toLowerCase(),
          displayName: result.data.viewerDisplayName,
        });
      }

      return result.data;
    },
    [slug],
  );

  useEffect(() => {
    if (readPaymentLinkClicked(slug)) {
      setPaymentLinkClicked(true);
    }
  }, [slug]);

  useEffect(() => {
    const stored = readStoredRegistration(slug);
    if (stored) {
      setForm(stored);
      void refreshSession(stored.email);
    }

    if (past) return;

    const refreshAttendees = () => {
      void refreshSession(readStoredRegistration(slug)?.email);
    };

    const interval = window.setInterval(refreshAttendees, 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAttendees();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [past, refreshSession, slug]);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await apiPost<{
      success: boolean;
      message: string;
      signup: { id: string; displayName: string };
    }>(
      `/api/trial-sessions/${slug}/signup`,
      {
        email: form.email.trim(),
        displayName: form.displayName.trim(),
      },
      "Could not register for this session",
    );

    setLoading(false);

    if (!result.ok) {
      const refreshed = await refreshSession(form.email.trim());
      if (refreshed?.viewerRegistered) {
        setDuplicatePrompt(true);
        setError(null);
        setMessage(
          `You're already registered as ${refreshed.viewerDisplayName ?? "a participant"}. Update your name below if you'd like it changed.`,
        );
        return;
      }
      setError(result.error);
      return;
    }

    writeStoredRegistration(slug, {
      email: form.email,
      displayName: form.displayName,
    });
    setViewerRegistered(true);
    setDuplicatePrompt(false);
    setMessage(result.data.message);
    await refreshSession(form.email.trim());
  };

  const handleUpdateName = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await apiPatch<{
      success: boolean;
      message: string;
      signup: { id: string; displayName: string };
    }>(
      `/api/trial-sessions/${slug}/signup`,
      {
        email: form.email.trim(),
        displayName: form.displayName.trim(),
      },
      "Could not update your name",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    writeStoredRegistration(slug, {
      email: form.email,
      displayName: result.data.signup.displayName,
    });
    setViewerRegistered(true);
    setDuplicatePrompt(false);
    setMessage(result.data.message);
    await refreshSession(form.email.trim());
  };

  const registrationForm = (
    <form
      className={cn("space-y-4", !canRegister && "opacity-60")}
      onSubmit={
        duplicatePrompt || viewerRegistered ? handleUpdateName : handleRegister
      }
    >
      <div>
        <Label htmlFor="trial-email">Email</Label>
        <Input
          id="trial-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              email: event.target.value,
            }))
          }
          readOnly={duplicatePrompt || viewerRegistered}
          disabled={!canRegister}
          required
        />
        <p className="mt-1 text-xs text-zinc-500">
          Used to prevent duplicate registrations — not shown to other attendees.
        </p>
      </div>
      <div>
        <Label htmlFor="trial-display-name">Name on the list</Label>
        <Input
          id="trial-display-name"
          autoComplete="name"
          value={form.displayName}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              displayName: event.target.value,
            }))
          }
          disabled={!canRegister}
          required
        />
      </div>
      {error && <FormError message={error} />}
      {message && <SuccessBanner message={message} />}
      <button
        type="submit"
        disabled={loading || !canRegister}
        className="inline-flex w-full items-center justify-center rounded-lg bg-jackals-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jackals-red/90 disabled:opacity-60"
      >
        {loading
          ? duplicatePrompt || viewerRegistered
            ? "Updating..."
            : "Registering..."
          : duplicatePrompt || viewerRegistered
            ? "Update name"
            : "Register to attend"}
      </button>
    </form>
  );

  return (
    <PageContainer>
      <AnimateIn immediate>
        <div className="mb-8 overflow-hidden border border-jackals-red/25 bg-gradient-to-br from-jackals-red/15 via-jackals-surface to-jackals-surface">
          <div className="border-b border-jackals-red/20 px-6 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
              <CalendarDays className="h-3.5 w-3.5" />
              Trial session
            </div>
          </div>
          <div className="px-6 py-6">
            <h1 className="font-display text-2xl font-semibold text-white">
              {session.title}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {format(eventDate, "EEEE d MMMM yyyy")}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Clock className="h-4 w-4 shrink-0 text-jackals-red-light" />
                {timeLabel}
              </div>
              {(session.location || session.locationUrl) && (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <MapPin className="h-4 w-4 shrink-0 text-jackals-red-light" />
                  {session.locationUrl ? (
                    <a
                      href={session.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1.5 text-jackals-red-light underline decoration-jackals-red/40 underline-offset-2 transition-colors hover:text-jackals-red hover:decoration-jackals-red"
                    >
                      <span className="truncate">
                        {session.location ?? "Open in Maps"}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : (
                    session.location
                  )}
                </div>
              )}
              {session.coachName && (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <GraduationCap className="h-4 w-4 shrink-0 text-jackals-red-light" />
                  Trialed by Coach {session.coachName}
                </div>
              )}
            </div>

            {session.description && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-500">
                {session.description}
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
              {past
                ? "This session has already started."
                : hasPaymentStep
                  ? "Pay first, then register with your email and name."
                  : "Register with your email and the name you'd like coaches to see."}
            </CardDescription>

            <div className="mt-6">
              {hasPaymentStep && session.paymentUrl && (
                <JoinFlowStep step={1} title="Pay session fee">
                  <SessionPaymentSection
                    paymentUrl={session.paymentUrl}
                    payLabel="Payment link"
                    sessionFee={session.sessionFee}
                    showInstructions={false}
                    onPaymentLinkClick={markPaymentLinkClicked}
                  />
                </JoinFlowStep>
              )}

              {hasPaymentStep && !session.paymentUrl && session.sessionFee != null && (
                <JoinFlowStep step={1} title="Session fee">
                  <EntryFeeBadge amount={session.sessionFee} label="session fee" />
                </JoinFlowStep>
              )}

              {!past && (
                <JoinFlowStep
                  step={registerStep}
                  title={
                    viewerRegistered && !duplicatePrompt
                      ? "Your registration"
                      : duplicatePrompt
                        ? "Already registered"
                        : "Register for this session"
                  }
                  isLast
                >
                  {viewerRegistered && !duplicatePrompt ? (
                    <p className="mb-4 text-sm text-zinc-400">
                      You&apos;re on the list. Change your display name below if
                      needed — your email stays private.
                    </p>
                  ) : duplicatePrompt ? (
                    <p className="mb-4 text-sm text-zinc-400">
                      This email is already registered. Update your name below if
                      you&apos;d like it changed.
                    </p>
                  ) : !canRegister ? (
                    <p className="mb-4 text-sm text-zinc-400">
                      Open the payment link above first, then register with your
                      email and name.
                    </p>
                  ) : (
                    <p className="mb-4 text-sm text-zinc-400">
                      {hasPaymentStep
                        ? "After paying, register below with your email and name."
                        : "No account needed — we only show your name to other attendees."}
                    </p>
                  )}
                  {registrationForm}
                </JoinFlowStep>
              )}
            </div>
          </Card>
        </AnimateIn>

        <AnimateIn immediate className="lg:col-span-3">
          <Card>
            <CardTitle className="text-base">Who&apos;s attending</CardTitle>

            <div className="mt-6">
              {session.attendees.length === 0 ? (
                <p className="text-sm text-zinc-600">No one registered yet.</p>
              ) : (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-x-2 gap-y-4">
                  {session.attendees.map((attendee) => (
                    <li
                      key={attendee.id}
                      className="flex min-w-0 flex-col items-center gap-1.5 text-center"
                    >
                      <TeamMemberAvatar
                        name={attendee.displayName}
                        className={cn(
                          "h-10 w-10 ring-2 ring-green-500/35",
                          viewerRegistered &&
                            form.displayName.trim() &&
                            attendee.displayName.trim().toLowerCase() ===
                              form.displayName.trim().toLowerCase()
                            ? "ring-jackals-red ring-offset-2 ring-offset-jackals-surface"
                            : "",
                        )}
                      />
                      <span
                        className="w-full truncate text-[11px] font-medium leading-tight text-zinc-400"
                        title={attendee.displayName}
                      >
                        {firstName(attendee.displayName)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </AnimateIn>
      </div>
    </PageContainer>
  );
}
