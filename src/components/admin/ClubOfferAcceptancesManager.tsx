"use client";

import { useMemo, useState } from "react";
import {
  Clock3,
  Download,
  LayoutGrid,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Rows3,
  Search,
  Shirt,
} from "lucide-react";
import { OfferSignatureModal } from "@/components/admin/OfferSignatureModal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Select } from "@/components/ui/Input";
import type {
  ClubOfferResponseRecord,
  ClubOfferResponseStatus,
} from "@/lib/club-offer-response-config";
import { CLUB_OFFER_TEAMS, type ClubOfferTeamSlug } from "@/lib/club-offer-config";
import { apiGet } from "@/lib/client-api";
import { downloadExcelFromUrl } from "@/lib/download-excel";
import {
  formatOfferSubmittedAt,
  offerResponseStatusBadgeClass,
  offerResponseStatusLabel,
} from "@/lib/offer-response-shared";
import { cn } from "@/lib/utils";

type LayoutMode = "cards" | "compact";
type StatusFilter = "ALL" | ClubOfferResponseStatus;
type TeamFilter = "ALL" | ClubOfferTeamSlug;

const STATUS_TABS = [
  { id: "ALL" as const, label: "All" },
  { id: "ACCEPTED" as const, label: "Accepted" },
  { id: "DECLINED" as const, label: "Declined" },
];

function ContactRow({
  email,
  phoneNumber,
}: {
  email: string;
  phoneNumber: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
      <a
        href={`mailto:${email}`}
        className="inline-flex min-w-0 items-center gap-1.5 text-zinc-300 transition hover:text-jackals-gold"
      >
        <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
        <span className="truncate">{email}</span>
      </a>
      {phoneNumber ? (
        <a
          href={`tel:${phoneNumber}`}
          className="inline-flex items-center gap-1.5 text-zinc-400 transition hover:text-white"
        >
          <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          {phoneNumber}
        </a>
      ) : null}
    </div>
  );
}

export function ClubOfferAcceptancesManager({
  initialResponses,
}: {
  initialResponses: ClubOfferResponseRecord[];
}) {
  const [responses, setResponses] = useState(initialResponses);
  const [layout, setLayout] = useState<LayoutMode>("cards");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("ALL");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<{
    fullName: string;
    signatureDataUrl: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return responses.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (teamFilter !== "ALL" && row.teamSlug !== teamFilter) return false;
      if (!query) return true;

      const haystack = [
        row.fullName,
        row.email,
        row.phoneNumber,
        row.teamLabel,
        row.preferredKitNumber1,
        row.preferredKitNumber2,
        offerResponseStatusLabel(row.status),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [responses, statusFilter, teamFilter, search]);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);

    const result = await apiGet<{ responses: ClubOfferResponseRecord[] }>(
      "/api/admin/club-offer-acceptances",
      "refresh the club offer responses list",
    );

    setRefreshing(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setResponses(result.data.responses);
  };

  const clearFilters = () => {
    setTeamFilter("ALL");
    setSearch("");
  };

  const hasSecondaryFilters =
    teamFilter !== "ALL" || search.trim() !== "";
  const exportUsesFilters =
    statusFilter !== "ALL" || teamFilter !== "ALL" || search.trim() !== "";

  const downloadExcel = async () => {
    setExporting(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (teamFilter !== "ALL") params.set("teamSlug", teamFilter);
      if (search.trim()) params.set("search", search.trim());
      const query = params.toString();
      await downloadExcelFromUrl(
        query
          ? `/api/admin/club-offer-acceptances/export?${query}`
          : "/api/admin/club-offer-acceptances/export",
        "jackals-vc-club-offer-responses.xlsx",
      );
    } catch {
      setError("Couldn't download the Excel sheet. Try again in a moment.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <OfferSignatureModal
        open={Boolean(signaturePreview)}
        onClose={() => setSignaturePreview(null)}
        fullName={signaturePreview?.fullName ?? ""}
        signatureDataUrl={signaturePreview?.signatureDataUrl ?? ""}
      />

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/20 p-1">
            {STATUS_TABS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setStatusFilter(option.id)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition sm:py-1.5",
                  statusFilter === option.id
                    ? "bg-jackals-red text-white shadow-sm"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-white/10">
              {(
                [
                  { id: "cards" as const, icon: LayoutGrid, label: "Cards" },
                  { id: "compact" as const, icon: Rows3, label: "Compact" },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  title={option.label}
                  onClick={() => setLayout(option.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition",
                    layout === option.id
                      ? "bg-white/10 text-white"
                      : "bg-transparent text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                  )}
                >
                  <option.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={exporting}
              onClick={() => void downloadExcel()}
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing…
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {exportUsesFilters ? "Excel (filtered)" : "Excel"}
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={refreshing}
              onClick={() => void refresh()}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone…"
              className="pl-9"
            />
          </div>
          <Select
            value={teamFilter}
            onChange={(event) =>
              setTeamFilter(event.target.value as TeamFilter)
            }
          >
            <option value="ALL">All teams</option>
            {Object.values(CLUB_OFFER_TEAMS).map((team) => (
              <option key={team.slug} value={team.slug}>
                {team.shortName}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">
            Showing{" "}
            <span className="font-medium text-zinc-300">{filtered.length}</span>
            {filtered.length !== responses.length ? (
              <span> of {responses.length}</span>
            ) : null}
          </p>
          {hasSecondaryFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-zinc-500 transition hover:text-zinc-300"
            >
              Clear search and team
            </button>
          ) : null}
        </div>
      </div>

      <FormError message={error} />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <p className="text-base font-semibold text-white">
            {responses.length === 0
              ? "No responses yet"
              : "No matching responses"}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {responses.length === 0
              ? "Acceptances and declines from Club Offer pages will appear here."
              : "Try a different status tab or clear your filters."}
          </p>
        </div>
      ) : layout === "compact" ? (
        <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
          {filtered.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-2 bg-white/[0.02] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">{row.fullName}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      offerResponseStatusBadgeClass(row.status),
                    )}
                  >
                    {offerResponseStatusLabel(row.status)}
                  </span>
                  <span className="text-xs text-zinc-500">{row.teamLabel}</span>
                </div>
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {row.email}
                  {row.phoneNumber ? ` · ${row.phoneNumber}` : ""}
                  {row.status === "ACCEPTED" &&
                  row.preferredKitNumber1 != null &&
                  row.preferredKitNumber2 != null
                    ? ` · #${row.preferredKitNumber1} / #${row.preferredKitNumber2}`
                    : ""}
                </p>
              </div>
              <p className="shrink-0 text-xs text-zinc-600">
                {formatOfferSubmittedAt(row.createdAt)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const isAccepted = row.status === "ACCEPTED";
            const showSignature =
              isAccepted && Boolean(row.signatureDataUrl);

            return (
              <article
                key={row.id}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                        {row.fullName}
                      </h2>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          offerResponseStatusBadgeClass(row.status),
                        )}
                      >
                        {offerResponseStatusLabel(row.status)}
                      </span>
                      <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-xs text-zinc-400 ring-1 ring-inset ring-white/8">
                        {row.teamLabel}
                      </span>
                    </div>

                    <ContactRow
                      email={row.email}
                      phoneNumber={row.phoneNumber}
                    />

                    {isAccepted ? (
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/5 pt-3 text-sm">
                        <div className="inline-flex items-center gap-2 text-zinc-300">
                          <Shirt className="h-3.5 w-3.5 text-zinc-500" />
                          <span className="text-zinc-500">Kit</span>
                          <span className="font-medium text-white">
                            #{row.preferredKitNumber1 ?? "—"}
                          </span>
                          <span className="text-zinc-600">/</span>
                          <span className="font-medium text-white">
                            #{row.preferredKitNumber2 ?? "—"}
                          </span>
                        </div>
                        {showSignature ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSignaturePreview({
                                fullName: row.fullName,
                                signatureDataUrl: row.signatureDataUrl,
                              })
                            }
                            className="text-xs font-medium text-zinc-400 underline-offset-2 transition hover:text-white hover:underline"
                          >
                            View signature
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <p className="inline-flex shrink-0 items-center gap-1.5 text-xs text-zinc-600 sm:pt-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatOfferSubmittedAt(row.createdAt)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
