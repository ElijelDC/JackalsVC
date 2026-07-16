"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Input";
import { apiDelete, apiPostForm } from "@/lib/client-api";

export function TournamentRulesPdfField({
  eventId,
  rulesPdfUrl,
  onChange,
  disabled = false,
}: {
  eventId: string;
  rulesPdfUrl: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF files can be uploaded.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await apiPostForm<{ rulesPdfUrl: string | null }>(
      `/api/admin/events/${eventId}/rules`,
      formData,
      "Rules PDF upload failed.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onChange(result.data.rulesPdfUrl);
  };

  const removeFile = async () => {
    if (!rulesPdfUrl) return;
    setLoading(true);
    setError(null);

    const result = await apiDelete(
      `/api/admin/events/${eventId}/rules`,
      "Could not remove the rules PDF.",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onChange(null);
  };

  return (
    <div className="sm:col-span-2">
      <Label>Tournament rules PDF</Label>
      <p className="mt-1 text-xs text-zinc-500">
        Shown with preview on the public tournament schedule page.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {rulesPdfUrl ? (
          <a
            href={rulesPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-jackals-gold hover:underline"
          >
            <FileText className="h-4 w-4" />
            View current PDF
          </a>
        ) : (
          <span className="text-sm text-zinc-500">No rules document uploaded</span>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          disabled={disabled || loading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadFile(file);
            event.target.value = "";
          }}
        />

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {rulesPdfUrl ? "Replace PDF" : "Upload PDF"}
        </Button>

        {rulesPdfUrl ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled || loading}
            onClick={() => void removeFile()}
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
