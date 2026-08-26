"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
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
import { TrialSessionPaymentProofUpload } from "@/components/trials/TrialSessionPaymentProofUpload";
import { PageContainer } from "@/components/layout/PageShell";
import { apiGet, apiPatch, apiPost } from "@/lib/client-api";
import { formatEventDateTime } from "@/lib/event-display";
import type { PublicTrialSession } from "@/lib/trial-session-types";
import {
  TRIAL_SESSION_NEW_RECEIPT_REQUIRED,
  isTrialSessionRegistrationOpen,
  trialSessionRequiresPaymentProof,
} from "@/lib/trial-session-types";
import { cn } from "@/lib/utils";

type TrialSessionPublicViewProps = {
  slug: string;
  initialSession: PublicTrialSession;
  initialViewerRegistered: boolean;
  initialViewerPendingApproval: boolean;
  initialViewerRejected: boolean;
};

const STORAGE_PREFIX = "trial-session-registration:";
const GLOBAL_SIGNUP_PROFILE_KEY = "trial-session-signup-profile";
const PAYMENT_PROOF_PREFIX = "trial-session-payment-proof:";
const SUBMITTED_PREFIX = "trial-session-submitted:";
const VIEWER_STATE_PREFIX = "trial-session-viewer-state:";

type StoredViewerState = {
  email: string;
  registered: boolean;
  pending: boolean;
  rejected: boolean;
};

function storageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

function paymentProofKey(slug: string) {
  return `${PAYMENT_PROOF_PREFIX}${slug}`;
}

function submittedKey(slug: string) {
  return `${SUBMITTED_PREFIX}${slug}`;
}

function viewerStateKey(slug: string) {
  return `${VIEWER_STATE_PREFIX}${slug}`;
}

function readStoredViewerState(slug: string): StoredViewerState | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(viewerStateKey(slug));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<StoredViewerState>;
    if (!parsed.email?.trim()) return null;
    return {
      email: parsed.email.trim().toLowerCase(),
      registered: Boolean(parsed.registered),
      pending: Boolean(parsed.pending),
      rejected: Boolean(parsed.rejected),
    };
  } catch {
    return null;
  }
}

function writeStoredViewerState(slug: string, state: StoredViewerState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    viewerStateKey(slug),
    JSON.stringify({
      email: state.email.trim().toLowerCase(),
      registered: state.registered,
      pending: state.pending,
      rejected: state.rejected,
    }),
  );
}

function clearStoredViewerState(slug: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(viewerStateKey(slug));
}

function markSessionSubmitted(slug: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(submittedKey(slug), "1");
}

function hasSessionSubmitted(slug: string) {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(submittedKey(slug)) === "1";
}

function readStoredPaymentProofId(slug: string): string | null {
  if (typeof window === "undefined") return null;
  const proofId = localStorage.getItem(paymentProofKey(slug))?.trim();
  return proofId || null;
}

function writeStoredPaymentProofId(slug: string, proofId: string | null) {
  if (typeof window === "undefined") return;
  if (!proofId) {
    localStorage.removeItem(paymentProofKey(slug));
    return;
  }
  localStorage.setItem(paymentProofKey(slug), proofId);
}

type StoredRegistration = {
  email: string;
  displayName: string;
};

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

function writeGlobalSignupProfile(registration: StoredRegistration) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    GLOBAL_SIGNUP_PROFILE_KEY,
    JSON.stringify({
      email: registration.email.trim().toLowerCase(),
      displayName: registration.displayName.trim(),
    }),
  );
}

function readStoredRegistration(slug: string): StoredRegistration | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(storageKey(slug));
  if (raw) {
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

  return readGlobalSignupProfile();
}

function writeStoredRegistration(slug: string, registration: StoredRegistration) {
  if (typeof window === "undefined") return;
  const normalized = {
    email: registration.email.trim().toLowerCase(),
    displayName: registration.displayName.trim(),
  };
  localStorage.setItem(storageKey(slug), JSON.stringify(normalized));
  writeGlobalSignupProfile(normalized);
}

function firstName(name: string) {
  return name.split(" ").filter(Boolean)[0] ?? name;
}

type ClientBootstrap = {
  form: { email: string; displayName: string };
  hasStoredEmail: boolean;
  paymentProofId: string | null;
  proofReady: boolean;
  viewerRegistered: boolean;
  viewerRejected: boolean;
  statusConfirmed: boolean;
  initialMessage: string | null;
};

function readClientBootstrap(slug: string): ClientBootstrap {
  const empty: ClientBootstrap = {
    form: { email: "", displayName: "" },
    hasStoredEmail: false,
    paymentProofId: null,
    proofReady: false,
    viewerRegistered: false,
    viewerRejected: false,
    statusConfirmed: false,
    initialMessage: null,
  };

  if (typeof window === "undefined") return empty;

  const stored = readStoredRegistration(slug);
  const storedProofId = readStoredPaymentProofId(slug);
  const storedViewer = readStoredViewerState(slug);
  const viewerMatches =
    Boolean(stored?.email) && storedViewer?.email === stored!.email;
  const cachedRegistered = Boolean(viewerMatches && storedViewer!.registered);
  const cachedPending = Boolean(viewerMatches && storedViewer!.pending);
  const cachedRejected = Boolean(viewerMatches && storedViewer!.rejected);
  const cachedConfirmed = cachedRegistered || cachedRejected;
  const canReuseStoredProof = cachedRegistered || cachedPending;

  return {
    form: stored ?? empty.form,
    hasStoredEmail: Boolean(stored?.email),
    paymentProofId: canReuseStoredProof ? storedProofId : null,
    proofReady: Boolean(canReuseStoredProof && storedProofId),
    viewerRegistered: cachedRegistered,
    viewerRejected: cachedRejected,
    statusConfirmed: cachedConfirmed,
    initialMessage: cachedRejected
      ? "Your previous request was not approved. You can submit again below."
      : null,
  };
}

export function TrialSessionPublicView({
  slug,
  initialSession,
  initialViewerRegistered,
  initialViewerPendingApproval,
  initialViewerRejected,
}: TrialSessionPublicViewProps) {
  const [session, setSession] = useState(initialSession);
  const [viewerRegistered, setViewerRegistered] = useState(initialViewerRegistered);
  const [viewerPendingApproval, setViewerPendingApproval] = useState(
    initialViewerPendingApproval,
  );
  const [viewerRejected, setViewerRejected] = useState(initialViewerRejected);
  const [viewerCanResubmit, setViewerCanResubmit] = useState(false);
  const [form, setForm] = useState({ email: "", displayName: "" });
  const [duplicatePrompt, setDuplicatePrompt] = useState(false);
  const [paymentProofId, setPaymentProofId] = useState<string | null>(null);
  const [previousRejectedProofId, setPreviousRejectedProofId] = useState<
    string | null
  >(null);
  const [staleProofId, setStaleProofId] = useState<string | null>(null);
  const [proofReady, setProofReady] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusConfirmed, setStatusConfirmed] = useState(false);
  const [hasStoredEmail, setHasStoredEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const formDisplayNameRef = useRef(form.displayName);
  formDisplayNameRef.current = form.displayName;

  const awaitingViewerStatus =
    (statusLoading && !statusConfirmed) ||
    (hasStoredEmail && !statusConfirmed);
  const showPendingApproval =
    viewerPendingApproval && !duplicatePrompt && statusConfirmed;
  const canEditExistingRequest =
    viewerRegistered || showPendingApproval || duplicatePrompt;
  const lockSignupEmail =
    canEditExistingRequest ||
    (viewerRejected && !duplicatePrompt) ||
    (hasStoredEmail && !statusConfirmed);
  const receiptOnFile =
    (viewerRegistered || showPendingApproval) &&
    !duplicatePrompt &&
    statusConfirmed;

  const registrationOpen = isTrialSessionRegistrationOpen(session);
  const { dateLabel, timeLabel } = formatEventDateTime(
    session.startDate,
    session.endDate,
    { timeZone: "club" },
  );
  const hasPaymentStep =
    trialSessionRequiresPaymentProof(session) && registrationOpen;
  const registerStep = hasPaymentStep ? 3 : 1;
  const needsFreshReceipt =
    hasPaymentStep &&
    (viewerCanResubmit || viewerRejected) &&
    !duplicatePrompt &&
    statusConfirmed;
  const hasFreshReceipt =
    Boolean(paymentProofId) &&
    proofReady &&
    paymentProofId !== staleProofId &&
    paymentProofId !== previousRejectedProofId;
  const paymentRequirementMet =
    !hasPaymentStep ||
    viewerRegistered ||
    showPendingApproval ||
    duplicatePrompt ||
    (!needsFreshReceipt && Boolean(paymentProofId && proofReady)) ||
    (needsFreshReceipt && hasFreshReceipt);
  const canRegister =
    paymentRequirementMet &&
    (viewerRegistered ||
      viewerPendingApproval ||
      duplicatePrompt ||
      viewerRejected ||
      viewerCanResubmit ||
      !hasPaymentStep ||
      Boolean(paymentProofId && proofReady));

  const handlePaymentProofChange = useCallback(
    (nextProofId: string | null) => {
      setPaymentProofId(nextProofId);
      setProofReady(Boolean(nextProofId));
      writeStoredPaymentProofId(slug, nextProofId);
    },
    [slug],
  );

  const refreshSession = useCallback(
    async (email?: string) => {
      const query = email ? `?email=${encodeURIComponent(email)}` : "";
      const result = await apiGet<{
        session: PublicTrialSession;
        viewerRegistered: boolean;
        viewerPendingApproval: boolean;
        viewerRejected: boolean;
        viewerDisplayName: string | null;
        viewerPaymentProofId: string | null;
      }>(`/api/trial-sessions/${slug}${query}`);

      if (!result.ok) return null;

      const {
        session: nextSession,
        viewerRegistered: registered,
        viewerPendingApproval: pending,
        viewerRejected: rejected,
        viewerDisplayName,
        viewerPaymentProofId,
      } = result.data;

      setSession(nextSession);
      setViewerRegistered(registered);
      setViewerPendingApproval(pending);
      setViewerRejected(rejected);
      setDuplicatePrompt(false);

      const storedProofId = readStoredPaymentProofId(slug);
      setPreviousRejectedProofId(rejected ? viewerPaymentProofId : null);

      if (!rejected && viewerPaymentProofId) {
        setPaymentProofId(viewerPaymentProofId);
        setProofReady(true);
        writeStoredPaymentProofId(slug, viewerPaymentProofId);
      } else if (rejected) {
        setStaleProofId((current) => current ?? viewerPaymentProofId);
        // Keep a newly uploaded (unlinked) receipt; don't treat the old linked one as ready.
        if (storedProofId && storedProofId !== viewerPaymentProofId) {
          setPaymentProofId(storedProofId);
          setProofReady(true);
        } else if (viewerPaymentProofId) {
          setPaymentProofId(viewerPaymentProofId);
          setProofReady(false);
          writeStoredPaymentProofId(slug, viewerPaymentProofId);
        } else {
          setPaymentProofId(null);
          setProofReady(false);
          writeStoredPaymentProofId(slug, null);
        }
      } else if (storedProofId) {
        setPaymentProofId(storedProofId);
        setProofReady(true);
      } else {
        setPaymentProofId(null);
        setProofReady(false);
      }

      const hasActiveSignup = registered || pending || rejected;
      const normalizedEmail = email?.trim().toLowerCase() ?? "";
      const stored = readStoredRegistration(slug);
      if (hasActiveSignup && normalizedEmail) {
        markSessionSubmitted(slug);
      }
      setViewerCanResubmit(
        Boolean(normalizedEmail) &&
          !hasActiveSignup &&
          Boolean(stored?.email === normalizedEmail),
      );

      if (
        Boolean(normalizedEmail) &&
        !hasActiveSignup &&
        Boolean(stored?.email === normalizedEmail)
      ) {
        const baselineProof = storedProofId || viewerPaymentProofId;
        setStaleProofId((current) => current ?? baselineProof);
      }

      if (!hasActiveSignup && normalizedEmail) {
        writeStoredRegistration(slug, {
          email: normalizedEmail,
          displayName: viewerDisplayName ?? formDisplayNameRef.current.trim(),
        });
      }

      if (normalizedEmail && viewerDisplayName) {
        setForm({
          email: normalizedEmail,
          displayName: viewerDisplayName,
        });
      }

      if (rejected) {
        setError(null);
        setMessage(
          "Your previous request was not approved. You can submit again below.",
        );
      } else if (
        !hasActiveSignup &&
        hasSessionSubmitted(slug) &&
        normalizedEmail
      ) {
        setMessage(null);
      } else if (registered) {
        setMessage(null);
      }

      if (normalizedEmail && hasActiveSignup) {
        writeStoredViewerState(slug, {
          email: normalizedEmail,
          registered,
          pending,
          rejected,
        });
      } else if (normalizedEmail && !hasActiveSignup) {
        clearStoredViewerState(slug);
      }

      setStatusConfirmed(true);

      return result.data;
    },
    [slug],
  );

  const refreshSessionRef = useRef(refreshSession);
  refreshSessionRef.current = refreshSession;

  const syncViewerStatus = useCallback(
    async (email?: string, options: { silent?: boolean } = {}) => {
      const resolvedEmail =
        email?.trim() ||
        readStoredRegistration(slug)?.email ||
        form.email.trim();

      if (!resolvedEmail) {
        setStatusLoading(false);
        return null;
      }

      if (!options.silent) {
        setStatusLoading(true);
      }
      try {
        return await refreshSessionRef.current(resolvedEmail);
      } finally {
        if (!options.silent) {
          setStatusLoading(false);
        }
      }
    },
    [form.email, slug],
  );

  useLayoutEffect(() => {
    const bootstrap = readClientBootstrap(slug);
    setForm(bootstrap.form);
    setHasStoredEmail(bootstrap.hasStoredEmail);
    if (bootstrap.paymentProofId) {
      setPaymentProofId(bootstrap.paymentProofId);
      setProofReady(true);
    }
    if (bootstrap.viewerRegistered) {
      setViewerRegistered(true);
    }
    if (bootstrap.viewerRejected) {
      setViewerRejected(true);
    }
    if (bootstrap.statusConfirmed) {
      setStatusConfirmed(true);
    }
    if (bootstrap.initialMessage) {
      setMessage(bootstrap.initialMessage);
    }
  }, [slug]);

  useEffect(() => {
    const email = readStoredRegistration(slug)?.email;
    if (email) {
      const cachedViewer = readStoredViewerState(slug);
      const cacheConfirmed = Boolean(
        cachedViewer?.email === email &&
          (cachedViewer.registered || cachedViewer.rejected),
      );
      if (!cacheConfirmed) {
        setStatusLoading(true);
      }
      void refreshSessionRef
        .current(email)
        .then((data) => {
          if (data) {
            setStatusConfirmed(true);
          }
        })
        .finally(() => {
          setStatusLoading(false);
        });
    } else {
      setStatusConfirmed(true);
    }
  }, [slug]);

  useEffect(() => {
    if (!registrationOpen) return;

    const refreshAttendees = () => {
      const email =
        readStoredRegistration(slug)?.email ||
        form.email.trim().toLowerCase();
      if (!email) return;
      void refreshSessionRef.current(email);
    };

    const pollMs = !statusConfirmed
      ? 1_000
      : viewerPendingApproval
        ? 2_000
        : 5_000;
    const interval = window.setInterval(refreshAttendees, pollMs);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshAttendees();
      }
    };
    const onWindowFocus = () => {
      refreshAttendees();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onWindowFocus);
    };
  }, [form.email, registrationOpen, slug, statusConfirmed, viewerPendingApproval]);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (
      (viewerRejected || viewerCanResubmit) &&
      hasPaymentStep &&
      !hasFreshReceipt
    ) {
      setLoading(false);
      setError(TRIAL_SESSION_NEW_RECEIPT_REQUIRED);
      return;
    }

    if (
      viewerRejected &&
      hasPaymentStep &&
      (!paymentProofId || paymentProofId === previousRejectedProofId)
    ) {
      setLoading(false);
      setError(TRIAL_SESSION_NEW_RECEIPT_REQUIRED);
      return;
    }

    const result = await apiPost<{
      success: boolean;
      message: string;
      signup: { id: string; displayName: string };
    }>(
      `/api/trial-sessions/${slug}/signup`,
      {
        email: form.email.trim(),
        displayName: form.displayName.trim(),
        ...(hasPaymentStep && paymentProofId
          ? { paymentProofId }
          : {}),
      },
      "Could not register for this session",
    );

    setLoading(false);

    if (!result.ok) {
      const refreshed = await refreshSession(form.email.trim());
      if (/receipt|payment proof/i.test(result.error)) {
        setDuplicatePrompt(false);
        setError(result.error);
        return;
      }
      if (refreshed?.viewerRegistered) {
        setDuplicatePrompt(true);
        setError(null);
        setMessage(
          `You're already registered as ${refreshed.viewerDisplayName ?? "a participant"}. Update your name below if you'd like it changed.`,
        );
        return;
      }
      if (refreshed?.viewerPendingApproval) {
        setDuplicatePrompt(true);
        setError(null);
        setMessage(
          "Your request is already awaiting admin approval. You can update your name below if needed.",
        );
        return;
      }
      if (refreshed?.viewerRejected) {
        setDuplicatePrompt(false);
        setError(null);
        setMessage(
          "Your previous request was not approved. Update your details below and submit again.",
        );
        return;
      }
      if (
        refreshed &&
        !refreshed.viewerRegistered &&
        !refreshed.viewerPendingApproval &&
        !refreshed.viewerRejected
      ) {
        setDuplicatePrompt(false);
        setViewerPendingApproval(false);
        setViewerRegistered(false);
        setViewerRejected(false);
      }
      setError(result.error);
      return;
    }

    writeStoredRegistration(slug, {
      email: form.email,
      displayName: form.displayName,
    });
    markSessionSubmitted(slug);
    writeStoredViewerState(slug, {
      email: form.email.trim().toLowerCase(),
      registered: false,
      pending: true,
      rejected: false,
    });
    setViewerRegistered(false);
    setViewerPendingApproval(true);
    setViewerRejected(false);
    setPreviousRejectedProofId(null);
    setViewerCanResubmit(false);
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
      const refreshed = await refreshSession(form.email.trim());
      if (
        refreshed &&
        !refreshed.viewerRegistered &&
        !refreshed.viewerPendingApproval &&
        !refreshed.viewerRejected
      ) {
        setDuplicatePrompt(false);
        setViewerPendingApproval(false);
        setViewerRegistered(false);
        setViewerRejected(false);
        setError(
          "Your request is no longer active. Submit again if you'd like to join.",
        );
        return;
      }
      setError(result.error);
      return;
    }

    writeStoredRegistration(slug, {
      email: form.email,
      displayName: result.data.signup.displayName,
    });
    setDuplicatePrompt(false);
    setMessage(result.data.message);
    await refreshSession(form.email.trim());
  };

  const registrationForm = (
    <form
      className={cn("space-y-4", !canRegister && "opacity-60")}
      onSubmit={
        canEditExistingRequest ? handleUpdateName : handleRegister
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
          onBlur={() => {
            const email = form.email.trim();
            if (email) {
              void syncViewerStatus(email);
            }
          }}
          readOnly={lockSignupEmail}
          disabled={!canRegister}
          required
        />
        <p className="mt-1 text-xs text-zinc-500">
          Used to prevent duplicate requests — not shown to other attendees.
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
      {message && !needsFreshReceipt && <SuccessBanner message={message} />}
      {needsFreshReceipt && !hasFreshReceipt ? (
        <p className="text-sm text-amber-200/90">
          Upload a new receipt in step 2 before submitting.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading || !canRegister || (needsFreshReceipt && !hasFreshReceipt)}
        className="inline-flex w-full items-center justify-center rounded-lg bg-jackals-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jackals-red/90 disabled:opacity-60"
      >
        {loading
          ? canEditExistingRequest
            ? "Updating..."
            : "Submitting..."
          : canEditExistingRequest
            ? "Update name"
            : viewerRejected || viewerCanResubmit
              ? "Submit again for approval"
              : "Submit for approval"}
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
              Session
            </div>
          </div>
          <div className="px-6 py-6">
            <h1 className="font-display text-2xl font-semibold text-white">
              {session.title}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">{dateLabel}</p>

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
                  Coach {session.coachName}
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
              {registrationOpen
                ? hasPaymentStep
                  ? "Pay, upload your receipt, then submit your details for admin approval."
                  : "Submit your details for admin approval."
                : "Registration is closed for this session."}
            </CardDescription>

            <div className="mt-6">
              {hasPaymentStep && session.paymentUrl && (
                <JoinFlowStep step={1} title="Pay session fee">
                  <SessionPaymentSection
                    paymentUrl={session.paymentUrl}
                    payLabel="Payment link"
                    sessionFee={session.sessionFee}
                    showInstructions={false}
                  />
                </JoinFlowStep>
              )}

              {hasPaymentStep && !session.paymentUrl && session.sessionFee != null && (
                <JoinFlowStep step={1} title="Session fee">
                  <EntryFeeBadge amount={session.sessionFee} label="session fee" />
                </JoinFlowStep>
              )}

              {hasPaymentStep && (
                <JoinFlowStep
                  step={session.paymentUrl || session.sessionFee != null ? 2 : 1}
                  title={
                    needsFreshReceipt
                      ? "Upload a new payment receipt"
                      : receiptOnFile
                        ? "Payment receipt submitted"
                        : "Upload payment receipt"
                  }
                >
                  {needsFreshReceipt ? (
                    <TrialSessionPaymentProofUpload
                      slug={slug}
                      proofId={hasFreshReceipt ? paymentProofId : null}
                      onProofChange={handlePaymentProofChange}
                      disabled={awaitingViewerStatus}
                      forceReupload={!hasFreshReceipt}
                      forceReuploadMessage={
                        viewerRejected
                          ? "Your previous receipt cannot be reused. Upload a new screenshot from your banking app, then submit again in step 3."
                          : "Your saved receipt from last time cannot be reused. Upload a new screenshot from your banking app, then submit again in step 3."
                      }
                    />
                  ) : receiptOnFile ? (
                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          <p className="font-medium text-green-200">
                            Payment receipt on file
                          </p>
                          <p className="mt-1 text-green-300/80">
                            {showPendingApproval
                              ? "Your receipt is attached to your request. Nothing else to do here — an admin will review it soon."
                              : viewerRejected
                                ? "Your receipt from your previous request is saved. Submit again in step 3 if you'd like to rejoin."
                                : "Your receipt is saved. Update your name below if needed."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {viewerRejected && !duplicatePrompt ? (
                        <p className="mb-4 text-sm text-zinc-400">
                          Remove the previous receipt and upload a different
                          one, then submit again below.
                        </p>
                      ) : null}
                      <TrialSessionPaymentProofUpload
                        slug={slug}
                        proofId={paymentProofId}
                        onProofChange={handlePaymentProofChange}
                        disabled={awaitingViewerStatus}
                      />
                    </>
                  )}
                </JoinFlowStep>
              )}

              {registrationOpen && (
                <JoinFlowStep
                  step={registerStep}
                  title={
                    viewerRegistered && !duplicatePrompt
                      ? "You're approved"
                      : awaitingViewerStatus
                        ? "Checking status"
                      : showPendingApproval
                        ? "Awaiting approval"
                        : viewerRejected && !duplicatePrompt
                          ? "Request not approved"
                          : viewerCanResubmit && !duplicatePrompt
                            ? "Submit again"
                          : duplicatePrompt
                            ? "Request submitted"
                            : "Submit your details"
                  }
                  isLast
                >
                  {viewerRegistered && !duplicatePrompt ? (
                    <p className="mb-4 text-sm text-zinc-400">
                      You&apos;re on the list. Change your display name below if
                      needed — your email stays private.
                    </p>
                  ) : showPendingApproval ? (
                    <p className="mb-4 text-sm text-zinc-400">
                      Your request has been submitted. An admin will review it
                      soon — you&apos;ll appear on the list once approved. You
                      can update your name below while you wait.
                    </p>
                  ) : viewerRejected && !duplicatePrompt ? (
                    <>
                      <p className="mb-4 text-sm text-zinc-400">
                        Upload a new payment receipt in step 2, then submit again
                        below.
                      </p>
                      {needsFreshReceipt && !hasFreshReceipt ? (
                        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                          <p className="font-semibold text-amber-50">
                            Upload a new receipt first
                          </p>
                          <p className="mt-1 text-amber-100/90">
                            Your previous receipt cannot be reused. Go to step 2
                            and upload a fresh screenshot before submitting.
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : viewerCanResubmit && !duplicatePrompt ? (
                    <>
                      <p className="mb-4 text-sm text-zinc-400">
                        Upload your payment receipt again in step 2, then submit
                        below if you&apos;d still like to join.
                      </p>
                      {needsFreshReceipt && !hasFreshReceipt ? (
                        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                          <p className="font-semibold text-amber-50">
                            Upload a new receipt first
                          </p>
                          <p className="mt-1 text-amber-100/90">
                            Your saved receipt from last time cannot be reused.
                            Go to step 2 and upload a fresh screenshot before
                            submitting.
                          </p>
                        </div>
                      ) : null}
                    </>
                  ) : awaitingViewerStatus && hasStoredEmail ? (
                    <p className="mb-4 text-sm text-zinc-400">
                      Checking your request status…
                    </p>
                  ) : duplicatePrompt ? (
                    <p className="mb-4 text-sm text-zinc-400">
                      This email already has a request on file. Update your name
                      below if you&apos;d like it changed.
                    </p>
                  ) : !canRegister && !viewerRegistered && !viewerPendingApproval ? (
                    <p className="mb-4 text-sm text-zinc-400">
                      Upload your payment receipt above first, then submit your
                      email and name for approval.
                    </p>
                  ) : (
                    <p className="mb-4 text-sm text-zinc-400">
                      {hasPaymentStep
                        ? "Enter your email and the name you'd like coaches to see. An admin will approve your place."
                        : "Enter your email and name. An admin will approve your place."}
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
