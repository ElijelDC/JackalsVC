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
      },
      "send applicant emails",
    );

    setSending(false);
    setConfirmOpen(false);

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
    <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-white">
            Email applicants
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Write a saved message per tryout team. Each email starts with an
            automatic greeting like Hi Alex, — you only edit the body below.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={recipients.length === 0 || sending || loadingTemplates}
          onClick={() => setConfirmOpen(true)}
        >
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Email {recipients.length}{" "}
          {recipients.length === 1 ? "applicant" : "applicants"}
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

      {loadingTemplates ? (
        <p className="text-sm text-zinc-500">Loading saved templates…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
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
              <p className="mt-2 text-xs text-zinc-500">
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

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Preview
            </p>
            {previewApplication ? (
              <div className="mt-3 space-y-3 text-sm text-zinc-300">
                <p className="text-xs text-zinc-500">
                  To: {previewApplication.contactEmail}
                </p>
                <p className="font-medium text-white">{previewSubject}</p>
                <p className="text-zinc-200">
                  Hi {firstNameFrom(previewApplication.fullName)},
                </p>
                <div className="whitespace-pre-wrap leading-relaxed text-zinc-300">
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
            Send this message to {recipients.length}{" "}
            {recipients.length === 1 ? "applicant" : "applicants"} for{" "}
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
