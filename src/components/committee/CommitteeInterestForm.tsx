"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiPost } from "@/lib/client-api";
import { COMMITTEE_ROLES } from "@/lib/committee-roles-config";

const EMPTY_FORM = {
  fullName: "",
  roleInterest1: "",
  roleInterest2: "",
  roleInterest3: "",
};

type FormState = typeof EMPTY_FORM;

function RoleSelect({
  id,
  label,
  value,
  onChange,
  exclude,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  exclude: string[];
  disabled?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        disabled={disabled}
      >
        <option value="" disabled>
          Select a role
        </option>
        {COMMITTEE_ROLES.map((role) => (
          <option
            key={role.value}
            value={role.value}
            disabled={exclude.includes(role.value) && role.value !== value}
          >
            {role.title}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function CommitteeInterestModal({
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

  const updateForm = (patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    if (success) {
      resetForm();
    }
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await apiPost<{ success: boolean; message?: string }>(
      "/api/committee-interest",
      {
        fullName: form.fullName.trim(),
        roleInterest1: form.roleInterest1,
        roleInterest2: form.roleInterest2,
        roleInterest3: form.roleInterest3,
      },
      "Failed to submit preferences",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(
      result.data.message ??
        "Thanks — we've recorded your committee role preferences.",
    );
    setForm(EMPTY_FORM);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Express interest"
      description={
        <div className="space-y-2">
          <p className="font-display text-base font-semibold text-white">
            Your top three roles
          </p>
          <p className="text-sm leading-relaxed text-zinc-400">
            Enter your name and choose a first, second, and third preference.
          </p>
        </div>
      }
      className="max-w-[min(100%,40rem)]"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <SuccessBanner message={success} />

        <div>
          <Label htmlFor="committee-name">Full name</Label>
          <Input
            id="committee-name"
            value={form.fullName}
            onChange={(event) => updateForm({ fullName: event.target.value })}
            required
            autoComplete="name"
            placeholder="Your full name"
            disabled={Boolean(success)}
          />
        </div>

        <RoleSelect
          id="committee-role-1"
          label="1st choice"
          value={form.roleInterest1}
          onChange={(roleInterest1) => updateForm({ roleInterest1 })}
          exclude={[form.roleInterest2, form.roleInterest3]}
          disabled={Boolean(success)}
        />
        <RoleSelect
          id="committee-role-2"
          label="2nd choice"
          value={form.roleInterest2}
          onChange={(roleInterest2) => updateForm({ roleInterest2 })}
          exclude={[form.roleInterest1, form.roleInterest3]}
          disabled={Boolean(success)}
        />
        <RoleSelect
          id="committee-role-3"
          label="3rd choice"
          value={form.roleInterest3}
          onChange={(roleInterest3) => updateForm({ roleInterest3 })}
          exclude={[form.roleInterest1, form.roleInterest2]}
          disabled={Boolean(success)}
        />

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
          {!success ? (
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Submitting..." : "Submit preferences"}
            </Button>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}

export function CommitteeInterestButton({
  size = "lg",
  className,
  label = "Express interest",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
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
        {label}
      </Button>
      <CommitteeInterestModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
