"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { apiImportPaymentCsv, type CsvImportResult } from "@/lib/client-api";

export function AdminCsvImport() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);

  const submitImport = async () => {
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const response = await apiImportPaymentCsv(file);
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
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-lg font-semibold text-white">Import bank statement CSV</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Export transactions from SumUp Business Account or your bank, then upload the CSV here.
        We match incoming transfers by amount and payment reference.
      </p>

      <FormError message={error} />

      {result && (
        <div className="mt-4 border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          Imported {result.fileName ?? "CSV"}: matched {result.matched} of {result.scanned} rows
          {result.skippedDuplicates > 0 ? ` · ${result.skippedDuplicates} duplicates skipped` : ""}
          {result.unmatchedRows > 0 ? ` · ${result.unmatchedRows} rows had no matching payment` : ""}
          · {result.unmatchedPayments} payments still pending
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
            {file ? file.name : "Choose CSV file"}
          </span>
          <span className="mt-1 text-xs text-zinc-500">Max 5 MB</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setError(null);
            setResult(null);
          }}
        />

        <Button type="button" className="w-full" disabled={loading || !file} onClick={submitImport}>
          {loading ? "Importing..." : "Upload CSV & match payments"}
        </Button>
      </div>
    </section>
  );
}
