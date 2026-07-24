"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiPost } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import {
  TRIALS_INL_DIVISION_OPTIONS,
  TRIALS_POSITION_OPTIONS,
  TRIALS_TEAM_OPTIONS,
  trialsPlayedInlDivision,
} from "@/lib/trials-recruitment-config";

const DRAFT_STORAGE_KEY = "trials-application-draft";

const EMPTY_FORM = {
  tryingOutFor: "",
  fullName: "",
  age: "",
  contactEmail: "",
  contactNumber: "",
  yearsExperience: "",
  inlDivision: "",
  inlDivisionOther: "",
  inlTeamName: "",
  preferredPosition1: "",
  preferredPosition2: "",
};

type TrialsFormState = typeof EMPTY_FORM;

function hasFormContent(form: TrialsFormState) {
  return Object.values(form).some((value) => value.trim() !== "");
}

function readDraft(): TrialsFormState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<TrialsFormState>;
    // Drop legacy "Both" drafts
    if (parsed.tryingOutFor === "BOTH") {
      parsed.tryingOutFor = "";
    }
    return { ...EMPTY_FORM, ...parsed };
  } catch {
    return null;
  }
}

function writeDraft(form: TrialsFormState) {
  if (typeof window === "undefined") return;

  if (!hasFormContent(form)) {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
}

function clearDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DRAFT_STORAGE_KEY);
}

function teamAccentClasses(tryingOutFor: string) {
  if (tryingOutFor === "MENS_DIVISION_2") {
    return {
      panel: "border-jackals-red/60 bg-jackals-red/10 ring-1 ring-jackals-red/40",
      badge: "bg-jackals-red text-white",
      label: "text-jackals-red-light",
    };
  }
  if (tryingOutFor === "WOMENS_DIVISION_3") {
    return {
      panel: "border-purple-500/60 bg-purple-500/10 ring-1 ring-purple-400/40",
      badge: "bg-purple-600 text-white",
      label: "text-purple-300",
    };
  }
  return {
    panel: "border-white/10 bg-transparent",
    badge: "",
    label: "text-zinc-400",
  };
}

export function TrialsApplicationModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    if (!open) return;

    const draft = readDraft();
    if (draft && hasFormContent(draft)) {
      setForm(draft);
      setDraftRestored(true);
    } else {
      setDraftRestored(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || success) return;
    writeDraft(form);
  }, [form, open, success]);

  const updateForm = (patch: Partial<TrialsFormState>) => {
    setDraftRestored(false);
    setForm((current) => ({ ...current, ...patch }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
    setDraftRestored(false);
    clearDraft();
  };

  const handleClose = () => {
    if (success) {
      resetForm();
      onClose();
      return;
    }

    if (
      hasFormContent(form) &&
      !window.confirm(
        "Close this form? Your answers will be saved and restored when you open it again.",
      )
    ) {
      return;
    }

    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const playedInl = trialsPlayedInlDivision(form.inlDivision);

    const result = await apiPost<{ success: boolean; message?: string }>(
      "/api/trials-application",
      {
        tryingOutFor: form.tryingOutFor,
        fullName: form.fullName.trim(),
        age: Number(form.age),
        contactEmail: form.contactEmail.trim(),
        contactNumber: form.contactNumber.trim(),
        yearsExperience: Number(form.yearsExperience),
        inlDivision: form.inlDivision,
        inlDivisionOther:
          form.inlDivision === "OTHER"
            ? form.inlDivisionOther.trim()
            : undefined,
        inlTeamName: playedInl ? form.inlTeamName.trim() : undefined,
        preferredPosition1: form.preferredPosition1,
        preferredPosition2: form.preferredPosition2,
      },
      "Failed to submit application",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(
      result.data.message ??
        "Thanks — your trials application has been received. We'll be in touch soon.",
    );
    setForm(EMPTY_FORM);
    setDraftRestored(false);
    clearDraft();
  };

  const accent = teamAccentClasses(form.tryingOutFor);
  const selectedTeam = TRIALS_TEAM_OPTIONS.find(
    (option) => option.value === form.tryingOutFor,
  );
  const showInlTeam = trialsPlayedInlDivision(form.inlDivision);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeOnBackdrop={false}
      closeOnEscape={false}
      title="Trials application"
      description={
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-zinc-400">
            Register for our August 2026 trials for Men&apos;s Division 2 or
            Women&apos;s Division 3.
          </p>
          {draftRestored && !success ? (
            <p className="text-sm text-amber-300/90">
              Your previous answers have been restored.
            </p>
          ) : null}
        </div>
      }
      className="max-w-[min(100%,40rem)]"
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          "space-y-4 rounded-xl border p-1 transition-colors sm:p-2",
          accent.panel,
        )}
      >
        <SuccessBanner message={success} />

        <div className="space-y-3 px-1 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Trying out for</Label>
            {selectedTeam ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
                  accent.badge,
                )}
              >
                {selectedTeam.label}
              </span>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {TRIALS_TEAM_OPTIONS.map((option) => {
              const selected = form.tryingOutFor === option.value;
              const isRed = option.accent === "red";
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateForm({ tryingOutFor: option.value })}
                  className={cn(
                    "rounded-lg border px-4 py-4 text-left transition",
                    isRed
                      ? selected
                        ? "border-jackals-red bg-jackals-red text-white shadow-[0_0_0_1px_rgba(200,16,46,0.8)]"
                        : "border-jackals-red/50 bg-jackals-red/15 text-jackals-red-light hover:bg-jackals-red/25"
                      : selected
                        ? "border-purple-500 bg-purple-600 text-white shadow-[0_0_0_1px_rgba(147,51,234,0.8)]"
                        : "border-purple-500/50 bg-purple-500/15 text-purple-200 hover:bg-purple-500/25",
                  )}
                >
                  <span className="block text-xs font-semibold uppercase tracking-widest opacity-80">
                    {isRed ? "Division 2" : "Division 3"}
                  </span>
                  <span className="mt-1 block font-display text-base font-semibold sm:text-lg">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Keep required for native validation / a11y */}
          <input
            type="text"
            value={form.tryingOutFor}
            required
            readOnly
            tabIndex={-1}
            aria-hidden
            className="sr-only"
          />
        </div>

        <div className="px-1">
          <Label htmlFor="trials-app-name">Name</Label>
          <Input
            id="trials-app-name"
            value={form.fullName}
            onChange={(event) => updateForm({ fullName: event.target.value })}
            required
            autoComplete="name"
            placeholder="Your full name"
          />
        </div>

        <div className="grid gap-4 px-1 sm:grid-cols-2">
          <div>
            <Label htmlFor="trials-app-age">Age</Label>
            <Input
              id="trials-app-age"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={form.age}
              onChange={(event) => updateForm({ age: event.target.value })}
              required
              placeholder="e.g. 22"
            />
          </div>
          <div>
            <Label htmlFor="trials-app-experience">
              Volleyball experience (years)
            </Label>
            <Input
              id="trials-app-experience"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={form.yearsExperience}
              onChange={(event) =>
                updateForm({ yearsExperience: event.target.value })
              }
              required
              placeholder="e.g. 5"
            />
          </div>
        </div>

        <div className="grid gap-4 px-1 sm:grid-cols-2">
          <div>
            <Label htmlFor="trials-app-email">Email</Label>
            <Input
              id="trials-app-email"
              type="email"
              value={form.contactEmail}
              onChange={(event) =>
                updateForm({ contactEmail: event.target.value })
              }
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="trials-app-phone">Phone number</Label>
            <Input
              id="trials-app-phone"
              type="tel"
              value={form.contactNumber}
              onChange={(event) =>
                updateForm({ contactNumber: event.target.value })
              }
              required
              autoComplete="tel"
              placeholder="08x xxx xxxx"
            />
          </div>
        </div>

        <div className="px-1">
          <Label htmlFor="trials-app-inl">
            Division played during VLY Ireland INL 25/26 season
          </Label>
          <Select
            id="trials-app-inl"
            value={form.inlDivision}
            onChange={(event) =>
              updateForm({
                inlDivision: event.target.value,
                inlDivisionOther:
                  event.target.value === "OTHER" ? form.inlDivisionOther : "",
                inlTeamName: trialsPlayedInlDivision(event.target.value)
                  ? form.inlTeamName
                  : "",
              })
            }
            required
          >
            <option value="" disabled>
              Select a division
            </option>
            {TRIALS_INL_DIVISION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {form.inlDivision === "OTHER" ? (
          <div className="px-1">
            <Label htmlFor="trials-app-inl-other">Please state other</Label>
            <Input
              id="trials-app-inl-other"
              value={form.inlDivisionOther}
              onChange={(event) =>
                updateForm({ inlDivisionOther: event.target.value })
              }
              required
              placeholder="e.g. university league, overseas competition"
            />
          </div>
        ) : null}

        {showInlTeam ? (
          <div className="px-1">
            <Label htmlFor="trials-app-inl-team">
              What team did you play for?
            </Label>
            <Input
              id="trials-app-inl-team"
              value={form.inlTeamName}
              onChange={(event) =>
                updateForm({ inlTeamName: event.target.value })
              }
              required
              placeholder="Club / team name"
            />
          </div>
        ) : null}

        <div className="grid gap-4 px-1 sm:grid-cols-2">
          <div>
            <Label htmlFor="trials-app-pos1">Preferred position 1</Label>
            <Select
              id="trials-app-pos1"
              value={form.preferredPosition1}
              onChange={(event) =>
                updateForm({ preferredPosition1: event.target.value })
              }
              required
            >
              <option value="" disabled>
                Select position
              </option>
              {TRIALS_POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="trials-app-pos2">Preferred position 2</Label>
            <Select
              id="trials-app-pos2"
              value={form.preferredPosition2}
              onChange={(event) =>
                updateForm({ preferredPosition2: event.target.value })
              }
              required
            >
              <option value="" disabled>
                Select position
              </option>
              {TRIALS_POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="px-1">
          <FormError message={error} />
        </div>

        <div className="flex flex-col gap-3 px-1 pb-1 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {success ? "Close" : "Cancel"}
          </Button>
          {!success && (
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full sm:w-auto",
                form.tryingOutFor === "WOMENS_DIVISION_3" &&
                  "bg-purple-600 hover:bg-purple-500",
              )}
            >
              {loading ? "Submitting..." : "Submit application"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

export function TrialsApplicationButton({
  size = "lg",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <ClipboardList className="h-4 w-4 shrink-0" />
        Apply for trials
      </Button>
      <TrialsApplicationModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
