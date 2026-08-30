"use client";

import { useRef, useState } from "react";
import { ChevronDown, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import {
  apiImportBankStatementCsv,
  apiImportKitOrderBankStatementCsv,
  apiImportMerchandiseOrderBankStatementCsv,
  type BankStatementImportResult,
} from "@/lib/client-api";
import { spreadsheetAcceptAttr } from "@/lib/spreadsheet-accept";

type AdminBankStatementImportProps = {
  onImported?: (result: BankStatementImportResult) => void;
  /** When set, result copy focuses on this payment type. */
  focus?: "membership" | "kit" | "merchandise" | "all";
  endpoint?: "all" | "kit" | "merchandise";
};

function resultSummary(result: BankStatementImportResult, focus: AdminBankStatementImportProps["focus"]) {
  const parts = [
    `Scanned ${result.scanned} rows`,
    `matched ${result.matched} payment${result.matched === 1 ? "" : "s"}`,
  ];

  if (
    result.matchedMembership > 0 ||
    result.matchedKitOrders > 0 ||
    result.matchedMerchandiseOrders > 0
  ) {
    const breakdown: string[] = [];
    if (result.matchedMembership > 0) {
      breakdown.push(`${result.matchedMembership} membership`);
    }
    if (result.matchedKitOrders > 0) {
      breakdown.push(`${result.matchedKitOrders} kit`);
    }
    if (result.matchedMerchandiseOrders > 0) {
      breakdown.push(`${result.matchedMerchandiseOrders} merchandise`);
    }
    parts[parts.length - 1] = `matched ${result.matched} (${breakdown.join(", ")})`;
  }

  if (result.skippedDuplicates > 0) {
    parts.push(`${result.skippedDuplicates} duplicates skipped`);
  }
  if (result.unmatchedRows > 0) {
    parts.push(`${result.unmatchedRows} rows had no match`);
  }

  if (focus === "kit") {
    parts.push(`${result.unmatchedKitOrders} kit order${result.unmatchedKitOrders === 1 ? "" : "s"} still unpaid`);
  } else if (focus === "merchandise") {
    parts.push(
      `${result.unmatchedMerchandiseOrders} merchandise order${
        result.unmatchedMerchandiseOrders === 1 ? "" : "s"
      } still unpaid`,
    );
  } else if (focus === "membership") {
    parts.push(`${result.unmatchedPayments} membership payment${result.unmatchedPayments === 1 ? "" : "s"} still pending`);
  } else {
    const pending: string[] = [];
    if (result.unmatchedPayments > 0) {
      pending.push(`${result.unmatchedPayments} membership`);
    }
    if (result.unmatchedKitOrders > 0) {
      pending.push(`${result.unmatchedKitOrders} kit`);
    }
    if (result.unmatchedMerchandiseOrders > 0) {
      pending.push(`${result.unmatchedMerchandiseOrders} merchandise`);
    }
    if (pending.length > 0) {
      parts.push(`${pending.join(" · ")} still unpaid`);
    }
  }

  return parts.join(" · ");
}

export function AdminBankStatementImport({
  onImported,
  focus = "all",
  endpoint = "all",
}: AdminBankStatementImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BankStatementImportResult | null>(null);

  const submitImport = async () => {
    if (!file) {
      setError("Choose an Excel or CSV file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const response =
      endpoint === "kit"
        ? await apiImportKitOrderBankStatementCsv(file)
        : endpoint === "merchandise"
          ? await apiImportMerchandiseOrderBankStatementCsv(file)
          : await apiImportBankStatementCsv(file);
    setLoading(false);

    if (!response.ok) {
      setError(response.error);
      return;
    }

    setResult(response.data);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
    onImported?.(response.data);
  };

  return (
    <details className="group overflow-hidden rounded-xl border border-jackals-red/25 bg-white/[0.02]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none sm:px-5">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-jackals-gold" />
          <span className="text-sm font-medium text-white">
            Import bank statement
          </span>
          <span className="hidden text-xs text-zinc-500 sm:inline">
            Auto-match by amount & reference
          </span>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-white/10 px-4 py-4 sm:px-5">
        <p className="text-sm text-zinc-400">
          Export transactions from SumUp or your bank, fix anything in Excel if
          needed, then upload the .xlsx or CSV here. We match incoming transfers by
          amount and payment reference for membership, kit, and merchandise
          payments.
        </p>

        <FormError message={error} />

        {result ? (
          <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            {resultSummary(result, focus)}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/20 px-4 py-6 text-center transition-colors hover:border-jackals-red/40 hover:bg-jackals-red/5"
          >
            <Upload className="mb-2 h-6 w-6 text-zinc-500" />
            <span className="text-sm font-medium text-white">
              {file ? file.name : "Choose Excel or CSV file"}
            </span>
            <span className="mt-1 text-xs text-zinc-500">Max 5 MB</span>
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
            size="sm"
            disabled={loading || !file}
            onClick={() => void submitImport()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing…
              </>
            ) : (
              "Upload & auto-approve matches"
            )}
          </Button>
        </div>
      </div>
    </details>
  );
}
