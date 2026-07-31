"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiGet, apiPost, apiPut } from "@/lib/client-api";
import type { TrialsApplicationRecord } from "@/lib/trials-application-config";
import type { TrialsApplicationsFilter } from "@/lib/trials-applications-filter";
import {
  TRIALS_EMAIL_MERGE_FIELDS,
  firstNameFrom,
  getDefaultTrialsEmailTemplates,
  mergeTrialsEmailTemplate,
  type TrialsEmailTemplateMap,
} from "@/lib/trials-email-templates";
import {
  TRIALS_TEAM_OPTIONS,
  trialsTeamLabel,
  type TrialsTeamOption,
} from "@/lib/trials-recruitment-config";
import { cn } from "@/lib/utils";

export function TrialsApplicantEmailPanel({
  filteredApplications,
  filters,
}: {
  filteredApplications: TrialsApplicationRecord[];
  filters: TrialsApplicationsFilter;
}) {
  const [templates, setTemplates] = useState<TrialsEmailTemplateMap>(
    getDefaultTrialsEmailTemplates(),
  );
  const [activeTeam, setActiveTeam] = useState<TrialsTeamOption>(
    TRIALS_TEAM_OPTIONS[0].value,
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const recipients = useMemo(
    () =>
      filteredApplications.filter(
        (application) => application.tryingOutFor === activeTeam,
      ),
    [filteredApplications, activeTeam],
  );

  const previewApplication = recipients[0] ?? null;

  const selectedRecipients = useMemo(
    () =>
      recipients.filter((application) =>
        selectedApplicationIds.includes(application.id),
      ),
    [recipients, selectedApplicationIds],
  );

  const allRecipientsSelected =
    recipients.length > 0 &&
    recipients.every((application) =>
      selectedApplicationIds.includes(application.id),
    );

  useEffect(() => {
    setSelectedApplicationIds((current) => {
      const valid = new Set(recipients.map((application) => application.id));
      return current.filter((id) => valid.has(id));
    });
  }, [recipients]);

  useEffect(() => {
    setSelectedApplicationIds([]);
  }, [activeTeam]);

  const toggleApplicationSelection = (applicationId: string) => {
    setSelectedApplicationIds((current) =>
      current.includes(applicationId)
        ? current.filter((id) => id !== applicationId)
        : [...current, applicationId],
    );
  };

  const toggleSelectAllRecipients = () => {
    if (allRecipientsSelected) {
      setSelectedApplicationIds([]);
      return;
    }

    setSelectedApplicationIds(recipients.map((application) => application.id));
  };

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    const result = await apiGet<{ templates: TrialsEmailTemplateMap }>(
      "/api/admin/trials-applications/email-templates",
      "load email templates",
    );
    setLoadingTemplates(false);

    if (result.ok) {
      setTemplates(result.data.templates);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    const template = templates[activeTeam];
    setSubject(template.subject);
    setBody(template.body);
  }, [activeTeam, templates]);

  const saveTemplate = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    const result = await apiPut<{ templates: TrialsEmailTemplateMap }>(
      "/api/admin/trials-applications/email-templates",
      { team: activeTeam, subject, body },
      "save this email template",
    );

    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setTemplates(result.data.templates);
    setMessage(`Saved ${trialsTeamLabel(activeTeam)} email template.`);
  };

  const sendEmails = async () => {
    setSending(true);
    setError(null);
    setMessage(null);

    const result = await apiPost<{
      attempted: number;
      delivered: number;
      failed: number;
    }>(
      "/api/admin/trials-applications/send-email",
      {
        team: activeTeam,
        subject,
        body,
        saveTemplate: true,
        filters,
        applicationIds: selectedRecipients.map((application) => application.id),
      },
      "send applicant emails",
    );

    setSending(false);
    setConfirmOpen(false);
    setSelectedApplicationIds([]);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const { delivered, failed } = result.data;
    setMessage(
      failed > 0
        ? `Sent ${delivered} email${delivered === 1 ? "" : "s"}. ${failed} could not be delivered.`
        : `Sent ${delivered} email${delivered === 1 ? "" : "s"}.`,
    );
  };

  const previewBody = previewApplication
    ? mergeTrialsEmailTemplate(body, previewApplication)
    : body;
  const previewSubject = previewApplication
    ? mergeTrialsEmailTemplate(subject, previewApplication)
    : subject;

  return (
    <section className="space-y-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-white">
            Email applicants
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Write a saved message per tryout team. Select who should receive it
            — useful for late sign-ups — then send.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={
            selectedRecipients.length === 0 || sending || loadingTemplates
          }
          onClick={() => setConfirmOpen(true)}
        >
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Email {selectedRecipients.length}{" "}
          {selectedRecipients.length === 1 ? "applicant" : "applicants"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-black/20 p-1.5">
        {TRIALS_TEAM_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setActiveTeam(option.value)}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition",
              activeTeam === option.value
                ? "bg-jackals-red text-white"
                : "text-zinc-400 hover:text-white",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {recipients.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-black/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
            <p className="text-sm font-medium text-white">
              {trialsTeamLabel(activeTeam)} recipients
            </p>
            <button
              type="button"
              onClick={toggleSelectAllRecipients}
              className="text-sm text-jackals-red-light transition-colors hover:text-jackals-red"
            >
              {allRecipientsSelected ? "Clear selection" : "Select all"}
            </button>
          </div>
          <p className="border-b border-white/10 px-3 py-2 text-xs text-zinc-500">
            {selectedRecipients.length} of {recipients.length} selected
          </p>
          <div className="max-h-56 overflow-y-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-950/95">
                <tr className="border-b border-white/10 text-zinc-500">
                  <th className="px-3 py-2 font-medium">
                    <input
                      type="checkbox"
                      checked={allRecipientsSelected}
                      onChange={toggleSelectAllRecipients}
                      aria-label={`Select all ${trialsTeamLabel(activeTeam)} applicants`}
                      className="rounded border-zinc-600"
                    />
                  </th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((application) => (
                  <tr
                    key={application.id}
                    className="border-b border-white/5 last:border-b-0"
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedApplicationIds.includes(application.id)}
                        onChange={() =>
                          toggleApplicationSelection(application.id)
                        }
                        aria-label={`Select ${application.fullName}`}
                        className="rounded border-zinc-600"
                      />
                    </td>
                    <td className="px-3 py-2 text-zinc-200">
                      {application.fullName}
                    </td>
                    <td className="px-3 py-2 text-zinc-400">
                      {application.contactEmail}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {new Date(application.createdAt).toLocaleDateString(
                        "en-IE",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          No filtered applicants for {trialsTeamLabel(activeTeam)}. Adjust your
          filters or switch team.
        </p>
      )}

      {loadingTemplates ? (
        <p className="text-sm text-zinc-500">Loading saved templates…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="min-w-0 space-y-4">
            <div>
              <Label htmlFor="trials-email-subject">Subject</Label>
              <Input
                id="trials-email-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="trials-email-body">Email body</Label>
              <Textarea
                id="trials-email-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={12}
                className="min-h-[14rem] font-mono text-sm leading-relaxed"
                placeholder="Paste trial links, group chat links, and any other details here."
              />
              <p className="mt-2 break-words text-xs text-zinc-500">
                Optional merge fields:{" "}
                {TRIALS_EMAIL_MERGE_FIELDS.map((field) => field.token).join(", ")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saving}
                onClick={() => void saveTemplate()}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save template
              </Button>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Preview
            </p>
            {previewApplication ? (
              <div className="mt-3 min-w-0 space-y-3 text-sm text-zinc-300">
                <p className="break-all text-xs text-zinc-500">
                  To: {previewApplication.contactEmail}
                </p>
                <p className="break-words font-medium text-white">{previewSubject}</p>
                <p className="text-zinc-200">
                  Hi {firstNameFrom(previewApplication.fullName)},
                </p>
                <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed text-zinc-300">
                  {previewBody}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                No filtered applicants for {trialsTeamLabel(activeTeam)}. Adjust
                your filters or switch team.
              </p>
            )}
          </div>
        </div>
      )}

      <FormError message={error} />
      {message ? <p className="text-sm text-green-300">{message}</p> : null}

      <Modal
        open={confirmOpen}
        onClose={() => !sending && setConfirmOpen(false)}
        title="Send applicant emails?"
        description={
          <p className="text-sm leading-relaxed text-zinc-400">
            Send this message to {selectedRecipients.length}{" "}
            {selectedRecipients.length === 1 ? "applicant" : "applicants"} for{" "}
            {trialsTeamLabel(activeTeam)}? The current subject and body will be
            saved for this team.
          </p>
        }
      >
        <Button
          type="button"
          onClick={() => void sendEmails()}
          disabled={sending}
          className="h-12 w-full gap-2 text-base"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          {sending ? "Sending..." : "Send emails"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirmOpen(false)}
          disabled={sending}
          className="h-12 w-full text-base"
        >
          Cancel
        </Button>
      </Modal>
    </section>
  );
}
