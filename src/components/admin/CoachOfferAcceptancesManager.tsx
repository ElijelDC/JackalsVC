"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ChevronDown,
  Download,
  FileSignature,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { OfferSignatureModal } from "@/components/admin/OfferSignatureModal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Select } from "@/components/ui/Input";
import type {
  CoachOfferResponseRecord,
  CoachOfferResponseStatus,
} from "@/lib/coach-offer-response-config";
import {
  COACH_OFFER_TEAMS,
  coachPoloMaterialLabel,
  type CoachOfferTeamSlug,
} from "@/lib/coach-offer-config";
import { apiDelete, apiGet } from "@/lib/client-api";
import { downloadExcelFromUrl } from "@/lib/download-excel";
import {
  formatOfferSubmittedAt,
  offerResponseStatusBadgeClass,
  offerResponseStatusLabel,
} from "@/lib/offer-response-shared";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | CoachOfferResponseStatus;
type TeamFilter = "ALL" | CoachOfferTeamSlug;

const STATUS_TABS = [
  { id: "ALL" as const, label: "All" },
  { id: "ACCEPTED" as const, label: "Accepted" },
  { id: "DECLINED" as const, label: "Declined" },
];

function formatPoloChoice(material: string, size: string) {
  const parts = [
    material ? coachPoloMaterialLabel(material) : "",
    size,
  ].filter(Boolean);
  return parts.join(" · ");
}

function hasSignature(row: CoachOfferResponseRecord) {
  return (
    row.status === "ACCEPTED" &&
    Boolean(row.signatureDataUrl) &&
    row.signatureDataUrl.startsWith("data:image/")
  );
}

function poloLabel(row: CoachOfferResponseRecord) {
  if (row.status !== "ACCEPTED") return null;
  if (!row.poloMaterial && !row.poloSize) return null;
  return formatPoloChoice(row.poloMaterial, row.poloSize);
}

export function CoachOfferAcceptancesManager({
  initialResponses,
}: {
  initialResponses: CoachOfferResponseRecord[];
}) {
  const [responses, setResponses] = useState(initialResponses);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
        row.poloMaterial,
        row.poloSize,
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

    const result = await apiGet<{ responses: CoachOfferResponseRecord[] }>(
      "/api/admin/coach-offer-acceptances",
      "refresh the coach offer responses list",
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

  const openSignature = (row: CoachOfferResponseRecord) => {
    setSignaturePreview({
      fullName: row.fullName,
      signatureDataUrl: row.signatureDataUrl,
    });
  };

  const handleDelete = async (row: CoachOfferResponseRecord) => {
    if (
      !confirm(
        `Delete ${row.fullName}'s ${offerResponseStatusLabel(row.status).toLowerCase()} response for ${row.teamLabel}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingId(row.id);
    setError(null);
    const result = await apiDelete(
      `/api/admin/coach-offer-acceptances/${row.id}`,
      "delete this coach offer response",
    );
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setResponses((current) => current.filter((item) => item.id !== row.id));
    if (expandedId === row.id) setExpandedId(null);
  };

  const hasSecondaryFilters = teamFilter !== "ALL" || search.trim() !== "";

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
          ? `/api/admin/coach-offer-acceptances/export?${query}`
          : "/api/admin/coach-offer-acceptances/export",
        "jackals-vc-coach-offer-responses.xlsx",
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
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={exporting}
              onClick={() => void downloadExcel()}
              title="Export Excel"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={refreshing}
              onClick={() => void refresh()}
              title="Refresh"
            >
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
              />
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
            {Object.values(COACH_OFFER_TEAMS).map((team) => (
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
              ? "Acceptances and declines from Coach Offer pages will appear here."
              : "Try a different status tab or clear your filters."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col />
                <col className="w-[6.5rem]" />
                <col className="w-[5.25rem]" />
                <col className="w-[6.5rem]" />
                <col className="w-[5rem]" />
              </colgroup>
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-2 py-2.5 font-medium">Name</th>
                  <th className="px-2 py-2.5 font-medium">Team</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5 font-medium">Date</th>
                  <th className="px-2 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filtered.map((row) => {
                  const expanded = expandedId === row.id;
                  const polo = poloLabel(row);
                  const showSignature = hasSignature(row);

                  return (
                    <Fragment key={row.id}>
                      <tr className="bg-white/[0.015] transition hover:bg-white/[0.03]">
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expanded ? null : row.id)
                            }
                            className="group flex min-w-0 items-center gap-1.5 text-left"
                          >
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                                expanded && "rotate-180",
                              )}
                            />
                            <span className="truncate font-medium text-white group-hover:text-jackals-gold">
                              {row.fullName}
                            </span>
                          </button>
                        </td>
                        <td className="px-2 py-2">
                          <span className="truncate text-xs text-zinc-400">
                            {row.teamLabel}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                              offerResponseStatusBadgeClass(row.status),
                            )}
                          >
                            {offerResponseStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-xs text-zinc-500">
                          {formatOfferSubmittedAt(row.createdAt)}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-end gap-1">
                            {showSignature ? (
                              <button
                                type="button"
                                title="View signature"
                                onClick={() => openSignature(row)}
                                className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
                              >
                                <FileSignature className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              title="Delete"
                              disabled={deletingId === row.id}
                              onClick={() => void handleDelete(row)}
                              className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                            >
                              {deletingId === row.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="bg-black/20">
                          <td colSpan={5} className="px-4 py-4">
                            <div className="space-y-2 text-sm text-zinc-400">
                              <p>
                                <span className="text-zinc-500">Email:</span>{" "}
                                <a
                                  href={`mailto:${row.email}`}
                                  className="text-zinc-300 transition hover:text-jackals-gold"
                                >
                                  {row.email}
                                </a>
                              </p>
                              <p>
                                <span className="text-zinc-500">Phone:</span>{" "}
                                {row.phoneNumber ? (
                                  <a
                                    href={`tel:${row.phoneNumber}`}
                                    className="text-zinc-300 transition hover:text-white"
                                  >
                                    {row.phoneNumber}
                                  </a>
                                ) : (
                                  "—"
                                )}
                              </p>
                              {polo ? (
                                <p>
                                  <span className="text-zinc-500">Polo:</span>{" "}
                                  {polo}
                                </p>
                              ) : null}
                              {showSignature ? (
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={() => openSignature(row)}
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-jackals-gold hover:underline"
                                  >
                                    <FileSignature className="h-3.5 w-3.5" />
                                    View signature
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 lg:hidden">
            {filtered.map((row) => {
              const polo = poloLabel(row);
              const showSignature = hasSignature(row);
              const expanded = expandedId === row.id;

              return (
                <article
                  key={row.id}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expanded ? null : row.id)
                      }
                      className="group flex min-w-0 flex-1 items-start gap-1.5 text-left"
                    >
                      <ChevronDown
                        className={cn(
                          "mt-1 h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                          expanded && "rotate-180",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-white group-hover:text-jackals-gold">
                          {row.fullName}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                              offerResponseStatusBadgeClass(row.status),
                            )}
                          >
                            {offerResponseStatusLabel(row.status)}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {row.teamLabel}
                          </span>
                          <span className="text-xs text-zinc-600">
                            {formatOfferSubmittedAt(row.createdAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                    <div className="flex shrink-0 gap-1">
                      {showSignature ? (
                        <button
                          type="button"
                          title="View signature"
                          onClick={() => openSignature(row)}
                          className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
                        >
                          <FileSignature className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        title="Delete"
                        disabled={deletingId === row.id}
                        onClick={() => void handleDelete(row)}
                        className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                      >
                        {deletingId === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  {expanded ? (
                    <div className="mt-3 space-y-2 border-t border-white/5 pt-3 text-sm text-zinc-400">
                      <p>
                        <span className="text-zinc-500">Email:</span>{" "}
                        <a
                          href={`mailto:${row.email}`}
                          className="text-zinc-300 transition hover:text-jackals-gold"
                        >
                          {row.email}
                        </a>
                      </p>
                      <p>
                        <span className="text-zinc-500">Phone:</span>{" "}
                        {row.phoneNumber ? (
                          <a
                            href={`tel:${row.phoneNumber}`}
                            className="text-zinc-300 transition hover:text-white"
                          >
                            {row.phoneNumber}
                          </a>
                        ) : (
                          "—"
                        )}
                      </p>
                      {polo ? (
                        <p>
                          <span className="text-zinc-500">Polo:</span> {polo}
                        </p>
                      ) : null}
                      {showSignature ? (
                        <button
                          type="button"
                          onClick={() => openSignature(row)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-jackals-gold hover:underline"
                        >
                          <FileSignature className="h-3.5 w-3.5" />
                          View signature
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
