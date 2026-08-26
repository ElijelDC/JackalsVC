"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import {
  AdminFormCard,
  AdminInlineEditCard,
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

function formFromClinic(clinic: ClinicItem): ClinicFormState {
  return {
    title: clinic.title,
    description: clinic.description ?? "",
    startDate: toDatetimeLocal(clinic.startDate),
    endDate: toDatetimeLocal(clinic.endDate),
    location: clinic.location ?? "",
    attendanceUrl: clinic.attendanceUrl ?? "",
    paymentUrl: clinic.paymentUrl ?? "",
    sessionFee: clinic.sessionFee?.toString() ?? "",
    reclubUsername: clinic.reclubUsername ?? "",
  };
}

function clinicPayload(form: ClinicFormState) {
  return {
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
}

function ClinicFields({
  form,
  setForm,
  idPrefix,
}: {
  form: ClinicFormState;
  setForm: (next: ClinicFormState) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input
          id={`${idPrefix}-title`}
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-start`}>Start</Label>
        <Input
          id={`${idPrefix}-start`}
          type="datetime-local"
          value={form.startDate}
          onChange={(event) =>
            setForm({ ...form, startDate: event.target.value })
          }
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-end`}>End (optional)</Label>
        <Input
          id={`${idPrefix}-end`}
          type="datetime-local"
          value={form.endDate}
          onChange={(event) => setForm({ ...form, endDate: event.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-location`}>Location</Label>
        <Input
          id={`${idPrefix}-location`}
          value={form.location}
          onChange={(event) =>
            setForm({ ...form, location: event.target.value })
          }
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-fee`}>Session fee (€)</Label>
        <Input
          id={`${idPrefix}-fee`}
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
        <Label htmlFor={`${idPrefix}-reclub`}>Reclub username</Label>
        <Input
          id={`${idPrefix}-reclub`}
          value={form.reclubUsername}
          onChange={(event) =>
            setForm({ ...form, reclubUsername: event.target.value })
          }
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-attendance`}>Attendance URL</Label>
        <Input
          id={`${idPrefix}-attendance`}
          type="url"
          value={form.attendanceUrl}
          onChange={(event) =>
            setForm({ ...form, attendanceUrl: event.target.value })
          }
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-payment`}>Payment URL</Label>
        <Input
          id={`${idPrefix}-payment`}
          type="url"
          value={form.paymentUrl}
          onChange={(event) =>
            setForm({ ...form, paymentUrl: event.target.value })
          }
        />
      </div>
    </div>
  );
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
  const [createForm, setCreateForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(createEmptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(createEmptyForm());
    setEditError(null);
  };

  const loadClinics = useCallback(async () => {
    const result = await apiGet<{ clinics: ClinicItem[] }>("/api/coach/clinics");
    if (result.ok) setClinics(result.data.clinics);
  }, [setClinics]);

  const startEdit = (clinic: ClinicItem) => {
    setEditingId(clinic.id);
    setEditForm(formFromClinic(clinic));
    setEditError(null);
    setListMessage(null);
    setCreateMessage(null);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setCreateError(null);
    setCreateMessage(null);

    const result = await apiPost("/api/coach/clinics", clinicPayload(createForm));

    setLoading(false);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }

    setCreateMessage("Clinic added.");
    setCreateForm(createEmptyForm());
    cancelEdit();
    await loadClinics();
    router.refresh();
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setEditError(null);
    setListMessage(null);

    const result = await apiPut(
      `/api/coach/clinics/${editingId}`,
      clinicPayload(editForm),
    );

    setLoading(false);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    setListMessage("Clinic updated.");
    cancelEdit();
    await loadClinics();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this skills clinic?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/coach/clinics/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }
    if (editingId === id) cancelEdit();
    setListMessage("Clinic deleted.");
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
        title="Add skills clinic"
        error={createError}
        message={createMessage}
        onSubmit={handleCreate}
        submitLabel="Add clinic"
        loading={loading && !editingId}
      >
        <ClinicFields
          form={createForm}
          setForm={setCreateForm}
          idPrefix="clinic-create"
        />
      </AdminFormCard>

      <div className="space-y-3">
        {listMessage ? (
          <p className="text-sm text-emerald-300">{listMessage}</p>
        ) : null}
        {clinics.length === 0 ? (
          <p className="text-sm text-zinc-500">No skills clinics yet.</p>
        ) : (
          clinics.map((clinic) => (
            <AdminInlineEditCard
              key={clinic.id}
              isEditing={editingId === clinic.id}
              title={clinic.title}
              subtitle={[
                format(new Date(clinic.startDate), "EEE d MMM yyyy · HH:mm"),
                clinic.location,
              ]
                .filter(Boolean)
                .join(" · ")}
              onEdit={() => startEdit(clinic)}
              onDelete={() => void handleDelete(clinic.id)}
              deleting={deletingId === clinic.id}
              onCancelEdit={cancelEdit}
              onSubmit={(e) => void handleUpdate(e)}
              loading={loading && editingId === clinic.id}
              error={editingId === clinic.id ? editError : null}
            >
              <ClinicFields
                form={editForm}
                setForm={setEditForm}
                idPrefix={`clinic-edit-${clinic.id}`}
              />
            </AdminInlineEditCard>
          ))
        )}
      </div>
    </CoachSection>
  );
}
