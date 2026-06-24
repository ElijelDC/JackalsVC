"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import {
  AdminFormCard,
  AdminListItem,
  beginAdminEdit,
} from "@/components/admin/AdminForm";
import { CoachSection } from "@/components/coach/CoachShell";
import { Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { DEFAULT_RECLUB_USERNAME } from "@/lib/club-payment-defaults";
import { toDatetimeLocal } from "@/lib/datetime-form";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";

type ClinicItem = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  attendanceUrl: string | null;
  paymentUrl: string | null;
  sessionFee: number | null;
  reclubUsername: string | null;
};

type ClinicFormState = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  attendanceUrl: string;
  paymentUrl: string;
  sessionFee: string;
  reclubUsername: string;
};

function createEmptyForm(): ClinicFormState {
  return {
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    attendanceUrl: "",
    paymentUrl: "",
    sessionFee: "25",
    reclubUsername: DEFAULT_RECLUB_USERNAME,
  };
}

export function CoachClinicsManager({
  initialClinics,
  teamName,
}: {
  initialClinics: ClinicItem[];
  teamName: string;
}) {
  const router = useRouter();
  const [clinics, setClinics] = useSyncedListState(initialClinics);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClinicFormState>(createEmptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
    setError(null);
  };

  const loadClinics = useCallback(async () => {
    const result = await apiGet<{ clinics: ClinicItem[] }>("/api/coach/clinics");
    if (result.ok) setClinics(result.data.clinics);
  }, [setClinics]);

  const startEdit = (clinic: ClinicItem) => {
    beginAdminEdit(() => {
      setEditingId(clinic.id);
      setForm({
        title: clinic.title,
        description: clinic.description ?? "",
        startDate: toDatetimeLocal(clinic.startDate),
        endDate: toDatetimeLocal(clinic.endDate),
        location: clinic.location ?? "",
        attendanceUrl: clinic.attendanceUrl ?? "",
        paymentUrl: clinic.paymentUrl ?? "",
        sessionFee: clinic.sessionFee?.toString() ?? "",
        reclubUsername: clinic.reclubUsername ?? "",
      });
      setError(null);
      setMessage(null);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
      title: form.title,
      description: form.description || undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      location: form.location || undefined,
      attendanceUrl: form.attendanceUrl || undefined,
      paymentUrl: form.paymentUrl || undefined,
      sessionFee: form.sessionFee ? Number(form.sessionFee) : undefined,
      reclubUsername: form.reclubUsername || undefined,
    };

    const result = editingId
      ? await apiPut(`/api/coach/clinics/${editingId}`, payload)
      : await apiPost("/api/coach/clinics", payload);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Clinic updated." : "Clinic added.");
    resetForm();
    await loadClinics();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this skills clinic?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/coach/clinics/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === id) resetForm();
    await loadClinics();
    router.refresh();
  };

  return (
    <CoachSection
      title="Skills clinics"
      description={`Create open skills clinics for ${teamName} and the wider club.`}
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Add skills clinic"
        title={editingId ? "Edit skills clinic" : "Add skills clinic"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Add clinic"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="clinic-title">Title</Label>
            <Input
              id="clinic-title"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="clinic-description">Description</Label>
            <Textarea
              id="clinic-description"
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="clinic-start">Start</Label>
            <Input
              id="clinic-start"
              type="datetime-local"
              value={form.startDate}
              onChange={(event) =>
                setForm({ ...form, startDate: event.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="clinic-end">End (optional)</Label>
            <Input
              id="clinic-end"
              type="datetime-local"
              value={form.endDate}
              onChange={(event) =>
                setForm({ ...form, endDate: event.target.value })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="clinic-location">Location</Label>
            <Input
              id="clinic-location"
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="clinic-fee">Session fee (€)</Label>
            <Input
              id="clinic-fee"
              type="number"
              min="0"
              step="0.01"
              value={form.sessionFee}
              onChange={(event) =>
                setForm({ ...form, sessionFee: event.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="clinic-reclub">Reclub username</Label>
            <Input
              id="clinic-reclub"
              value={form.reclubUsername}
              onChange={(event) =>
                setForm({ ...form, reclubUsername: event.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="clinic-attendance">Attendance URL</Label>
            <Input
              id="clinic-attendance"
              type="url"
              value={form.attendanceUrl}
              onChange={(event) =>
                setForm({ ...form, attendanceUrl: event.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="clinic-payment">Payment URL</Label>
            <Input
              id="clinic-payment"
              type="url"
              value={form.paymentUrl}
              onChange={(event) =>
                setForm({ ...form, paymentUrl: event.target.value })
              }
            />
          </div>
        </div>
      </AdminFormCard>

      <div className="space-y-3">
        {clinics.length === 0 ? (
          <p className="text-sm text-zinc-500">No skills clinics yet.</p>
        ) : (
          clinics.map((clinic) => (
            <AdminListItem
              key={clinic.id}
              title={clinic.title}
              subtitle={[
                format(new Date(clinic.startDate), "EEE d MMM yyyy · HH:mm"),
                clinic.location,
              ]
                .filter(Boolean)
                .join(" · ")}
              onEdit={() => startEdit(clinic)}
              onDelete={() => handleDelete(clinic.id)}
              deleting={deletingId === clinic.id}
            />
          ))
        )}
      </div>
    </CoachSection>
  );
}
