"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import { Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { Modal } from "@/components/ui/Modal";
import { apiPost } from "@/lib/client-api";
import {
  COACHING_COMMUTE_OPTIONS,
  COACHING_QUALIFICATION_LEVELS,
} from "@/lib/coaching-recruitment-config";

const DRAFT_STORAGE_KEY = "coaching-application-draft";

const EMPTY_FORM = {
  fullName: "",
  age: "",
  contactNumber: "",
  contactEmail: "",
  qualificationLevel: "",
  yearsExperience: "",
  canCommuteToBothVenues: "",
  whyInterested: "",
};

type CoachingFormState = typeof EMPTY_FORM;

function hasFormContent(form: CoachingFormState) {
  return Object.values(form).some((value) => value.trim() !== "");
}

function readDraft(): CoachingFormState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CoachingFormState>;
    return { ...EMPTY_FORM, ...parsed };
  } catch {
    return null;
  }
}

function writeDraft(form: CoachingFormState) {
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

export function CoachingApplicationModal({
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

  const updateForm = (patch: Partial<CoachingFormState>) => {
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

    const result = await apiPost<{ success: boolean; message?: string }>(
      "/api/coaching-application",
      {
        fullName: form.fullName.trim(),
        age: Number(form.age),
        contactNumber: form.contactNumber.trim(),
        contactEmail: form.contactEmail.trim(),
        qualificationLevel: form.qualificationLevel,
        yearsExperience: Number(form.yearsExperience),
        canCommuteToBothVenues: form.canCommuteToBothVenues,
        whyInterested: form.whyInterested.trim(),
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
        "Thanks — your application has been sent. We'll be in touch soon.",
    );
    setForm(EMPTY_FORM);
    setDraftRestored(false);
    clearDraft();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeOnBackdrop={false}
      closeOnEscape={false}
      title="Coaching application"
      description={
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-zinc-400">
            Complete the form below. We&apos;ll review your application and get
            back to you by email.
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <SuccessBanner message={success} />

        <div>
          <Label htmlFor="coach-app-name">Full name</Label>
          <Input
            id="coach-app-name"
            value={form.fullName}
            onChange={(event) => updateForm({ fullName: event.target.value })}
            required
            autoComplete="name"
            placeholder="Your full name"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="coach-app-age">Age</Label>
            <Input
              id="coach-app-age"
              type="number"
              min={16}
              max={99}
              value={form.age}
              onChange={(event) => updateForm({ age: event.target.value })}
              required
              inputMode="numeric"
              placeholder="e.g. 28"
            />
          </div>
          <div>
            <Label htmlFor="coach-app-experience">Years of experience</Label>
            <Input
              id="coach-app-experience"
              type="number"
              min={0}
              max={60}
              value={form.yearsExperience}
              onChange={(event) =>
                updateForm({ yearsExperience: event.target.value })
              }
              required
              inputMode="numeric"
              placeholder="e.g. 3"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="coach-app-phone">Contact number</Label>
            <Input
              id="coach-app-phone"
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
          <div>
            <Label htmlFor="coach-app-email">Contact email</Label>
            <Input
              id="coach-app-email"
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
        </div>

        <div>
          <Label htmlFor="coach-app-qualification">VLY Ireland Coach Level</Label>
          <Select
            id="coach-app-qualification"
            value={form.qualificationLevel}
            onChange={(event) =>
              updateForm({ qualificationLevel: event.target.value })
            }
            required
          >
            <option value="" disabled>
              Select VLY Ireland coach level
            </option>
            {COACHING_QUALIFICATION_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="coach-app-commute">
            Are you able to commute to both Luttrellstown Community Centre and
            Meakstown Community Centre?
          </Label>
          <Select
            id="coach-app-commute"
            value={form.canCommuteToBothVenues}
            onChange={(event) =>
              updateForm({ canCommuteToBothVenues: event.target.value })
            }
            required
          >
            <option value="" disabled>
              Select an answer
            </option>
            {COACHING_COMMUTE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="coach-app-why">
            Why are you interested in coaching for Jackals Volleyball Club?
          </Label>
          <Textarea
            id="coach-app-why"
            value={form.whyInterested}
            onChange={(event) =>
              updateForm({ whyInterested: event.target.value })
            }
            required
            rows={5}
            placeholder="Tell us about your coaching background and what draws you to Jackals..."
          />
        </div>

        <FormError message={error} />

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
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
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Submitting..." : "Submit application"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

export function CoachingApplicationButton({
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
        Coach with us
      </Button>
      <CoachingApplicationModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
