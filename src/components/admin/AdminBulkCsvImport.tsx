"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import {
  apiBulkImportCsv,
  getBulkImportTemplateUrl,
  type BulkImportResult,
  type BulkImportType,
} from "@/lib/client-api";
import { getBulkImportTemplateMeta } from "@/lib/bulk-import-config";
import { spreadsheetAcceptAttr } from "@/lib/spreadsheet-accept";

export function AdminBulkCsvImport({
  type,
  title,
  description,
  openTriggerLabel,
}: {
  type: BulkImportType;
  title?: string;
  description?: string;
  /** Label shown on the collapsed trigger. Defaults to a clear import CTA. */
  openTriggerLabel?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const meta = getBulkImportTemplateMeta(type);
  const sectionTitle = title ?? "Bulk import from Excel";
  const triggerLabel = openTriggerLabel ?? "Bulk Excel import";
  const sectionDescription =
    description ?? meta.instructions;

  const submitImport = async () => {
    if (!file) {
      setError("Choose an Excel file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const response = await apiBulkImportCsv(type, file);
    setLoading(false);

    if (!response.ok) {
      setError(response.error);
      return;
    }

    setResult(response.data);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  };

  return (
    <details className="group mb-8 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none sm:px-5">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-jackals-gold" />
          <span className="text-sm font-medium text-white">{triggerLabel}</span>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{sectionTitle}</h2>
            <p className="mt-2 text-sm text-zinc-400">{sectionDescription}</p>
          </div>
          <a
            href={getBulkImportTemplateUrl(type)}
            download={meta.fileName}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-white/20 bg-transparent px-3 py-2 text-sm font-semibold text-white transition-all duration-300 hover:border-jackals-red/50 hover:bg-jackals-red/10"
          >
            <Download className="h-4 w-4" />
            Download current Excel
          </a>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          Tip: add new rows at the top of the sheet, keep existing rows as-is, then
          re-upload. Duplicates are skipped automatically. Date and time columns
          are saved as text so Excel won&apos;t rewrite them.
        </p>

        <FormError message={error} />

        {result && (
          <div className="mt-4 space-y-3">
            <div className="border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
              Imported {result.fileName ?? "sheet"}: created {result.created} of{" "}
              {result.scanned} rows
              {result.skipped > 0 ? ` · ${result.skipped} skipped (duplicates)` : ""}
              {result.failed > 0 ? ` · ${result.failed} failed` : ""}
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded border border-jackals-red/30 bg-jackals-red/10 px-4 py-3 text-sm text-jackals-red-light">
                <p className="font-medium">Row errors</p>
                <ul className="mt-2 space-y-1">
                  {result.errors.map((entry) => (
                    <li key={`${entry.row}-${entry.message}`}>
                      Row {entry.row}: {entry.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 px-4 py-8 text-center transition-colors hover:border-jackals-red/40 hover:bg-jackals-red/5"
          >
            <Upload className="mb-2 h-8 w-8 text-zinc-500" />
            <span className="text-sm font-medium text-white">
              {file ? file.name : "Choose Excel file"}
            </span>
            <span className="mt-1 text-xs text-zinc-500">
              .xlsx preferred · CSV still accepted · Max 5 MB
            </span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept={spreadsheetAcceptAttr()}
            className="hidden"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError(null);
              setResult(null);
            }}
          />

          <Button
            type="button"
            className="w-full"
            disabled={loading}
            onClick={submitImport}
          >
            {loading ? "Importing..." : "Upload Excel & import rows"}
          </Button>
        </div>
      </div>
    </details>
  );
}
