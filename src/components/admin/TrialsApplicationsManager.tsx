"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRefreshAdminNotifications } from "@/components/admin/AdminNotificationsProvider";
import { TrialsApplicantEmailPanel } from "@/components/admin/TrialsApplicantEmailPanel";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Select } from "@/components/ui/Input";
import {
  TRIALS_APPLICATION_STATUS_LABELS,
  type TrialsApplicationRecord,
  type TrialsApplicationStatus,
} from "@/lib/trials-application-config";
import {
  TRIALS_POSITION_OPTIONS,
  TRIALS_TEAM_OPTIONS,
  trialsInlDivisionLabel,
  trialsPositionLabel,
  trialsTeamLabel,
} from "@/lib/trials-recruitment-config";
import { apiDelete, apiGet, apiPatch } from "@/lib/client-api";
import {
  filterTrialsApplications,
  hasTrialsApplicationsFilters,
  trialsApplicationsFilterToSearchParams,
  type TrialsApplicationsFilter,
  type TrialsApplicationsPositionFilter,
  type TrialsApplicationsStatusFilter,
  type TrialsApplicationsTeamFilter,
} from "@/lib/trials-applications-filter";
import { cn } from "@/lib/utils";

type StatusFilter = TrialsApplicationsStatusFilter;
type TeamFilter = TrialsApplicationsTeamFilter;
type PositionFilter = TrialsApplicationsPositionFilter;

const STATUS_TABS = [
  { id: "NEW", label: "Pending" },
  { id: "ALL", label: "All" },
  { id: "REVIEWED", label: "Reviewed" },
  { id: "DISMISSED", label: "Dismissed" },
] as const;

function formatSubmittedAt(value: string) {
  return new Date(value).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function teamAccent(tryingOutFor: string) {
  if (tryingOutFor === "MENS_DIVISION_2") {
    return "text-jackals-red-light bg-jackals-red/15";
  }
  if (tryingOutFor === "MENS_DIVISION_3") {
    return "text-zinc-300 bg-zinc-500/15";
  }
  if (tryingOutFor === "WOMENS_DIVISION_3") {
    return "text-purple-300 bg-purple-500/15";
  }
  return "text-zinc-400 bg-white/[0.06]";
}

function statusAccent(status: TrialsApplicationStatus) {
  if (status === "NEW") return "text-amber-300 bg-amber-500/10";
  if (status === "REVIEWED") return "text-emerald-300 bg-emerald-500/10";
  return "text-zinc-400 bg-white/[0.06]";
}

function RowActions({
  application,
  loading,
  canDeleteApplications,
  onAct,
  onReviewDismissed,
  onDeleteApplication,
}: {
  application: TrialsApplicationRecord;
  loading: boolean;
  canDeleteApplications: boolean;
  onAct: (id: string, action: "review" | "dismiss") => void;
  onReviewDismissed: (id: string) => void;
  onDeleteApplication: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {application.status === "NEW" ? (
        <>
          <button
            type="button"
            title="Mark reviewed"
            disabled={loading}
            onClick={() => onAct(application.id, "review")}
            className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            title="Dismiss"
            disabled={loading}
            onClick={() => onAct(application.id, "dismiss")}
            className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </>
      ) : null}

      {canDeleteApplications && application.status === "DISMISSED" ? (
        <button
          type="button"
          title="Mark reviewed"
          disabled={loading}
          onClick={() => onReviewDismissed(application.id)}
          className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}

      {canDeleteApplications &&
      (application.status === "REVIEWED" ||
        application.status === "DISMISSED") ? (
        <button
          type="button"
          title="Delete"
          disabled={loading}
          onClick={() => onDeleteApplication(application.id)}
          className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}

      <a
        href={`mailto:${application.contactEmail}`}
        title="Email"
        className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-jackals-gold"
      >
        <Mail className="h-3.5 w-3.5" />
      </a>
      <a
        href={`tel:${application.contactNumber}`}
        title="Call"
        className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
      >
        <Phone className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function ExpandDetails({
  application,
}: {
  application: TrialsApplicationRecord;
}) {
  return (
    <div className="grid gap-3 text-sm text-zinc-400 sm:grid-cols-2">
      <p>
        <span className="text-zinc-500">Email:</span>{" "}
        <a
          href={`mailto:${application.contactEmail}`}
          className="text-jackals-gold hover:underline"
        >
          {application.contactEmail}
        </a>
      </p>
      <p>
        <span className="text-zinc-500">Phone:</span>{" "}
        <a
          href={`tel:${application.contactNumber}`}
          className="text-zinc-300 hover:text-white"
        >
          {application.contactNumber}
        </a>
      </p>
      <p>
        <span className="text-zinc-500">Age:</span> {application.age}
      </p>
      <p>
        <span className="text-zinc-500">Years:</span>{" "}
        {application.yearsExperience}
      </p>
      <p>
        <span className="text-zinc-500">Positions:</span>{" "}
        {trialsPositionLabel(application.preferredPosition1)} /{" "}
        {trialsPositionLabel(application.preferredPosition2)}
      </p>
      <p>
        <span className="text-zinc-500">INL division 25/26:</span>{" "}
        {trialsInlDivisionLabel(application.inlDivision)}
        {application.inlDivisionOther
          ? ` — ${application.inlDivisionOther}`
          : ""}
      </p>
      {application.inlTeamName ? (
        <p>
          <span className="text-zinc-500">INL team:</span>{" "}
          {application.inlTeamName}
        </p>
      ) : null}
      <p className="text-xs text-zinc-600 sm:col-span-2">
        Submitted {formatSubmittedAt(application.createdAt)}
      </p>
    </div>
  );
}

export function TrialsApplicationsManager({
  initialApplications,
  listApiPath = "/api/admin/trials-applications",
  actionApiPath = "/api/admin/trials-applications",
  exportApiPath = "/api/admin/trials-applications/export",
  canDeleteApplications = false,
  canEmailApplicants = false,
}: {
  initialApplications: TrialsApplicationRecord[];
  listApiPath?: string;
  actionApiPath?: string;
  exportApiPath?: string;
  canDeleteApplications?: boolean;
  canEmailApplicants?: boolean;
}) {
  const router = useRouter();
  const refreshNotifications = useRefreshAdminNotifications();
  const [applications, setApplications] = useState(initialApplications);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("NEW");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("ALL");
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo<TrialsApplicationsFilter>(
    () => ({
      status: statusFilter,
      team: teamFilter,
      position: positionFilter,
      search,
    }),
    [statusFilter, teamFilter, positionFilter, search],
  );

  const filtered = useMemo(
    () => filterTrialsApplications(applications, filters),
    [applications, filters],
  );

  const refresh = async () => {
    setRefreshing(true);
    setError(null);

    const result = await apiGet<{ applications: TrialsApplicationRecord[] }>(
      listApiPath,
      "refresh the signups list",
    );

    setRefreshing(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setApplications(result.data.applications);
    void refreshNotifications();
  };

  const act = async (id: string, action: "review" | "dismiss") => {
    setLoadingId(id);
    setError(null);

    const result = await apiPatch<{ application: TrialsApplicationRecord }>(
      `${actionApiPath}/${id}`,
      { action },
      action === "review"
        ? "mark this signup as reviewed"
        : "dismiss this signup",
    );

    setLoadingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setApplications((current) =>
      current.map((item) =>
        item.id === id ? result.data.application : item,
      ),
    );

    router.refresh();
    void refreshNotifications();
  };

  const reviewDismissed = async (id: string) => {
    await act(id, "review");
  };

  const deleteApplication = async (id: string) => {
    const application = applications.find((item) => item.id === id);
    const name = application?.fullName ?? "this signup";
    const statusLabel =
      application?.status === "REVIEWED" ? "reviewed" : "dismissed";
    if (
      !window.confirm(
        `Delete ${name}? This permanently removes the ${statusLabel} signup.`,
      )
    ) {
      return;
    }

    setLoadingId(id);
    setError(null);

    const result = await apiDelete(
      `${actionApiPath}/${id}`,
      "delete this signup",
    );

    setLoadingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setApplications((current) => current.filter((item) => item.id !== id));
    if (expandedId === id) setExpandedId(null);
    router.refresh();
    void refreshNotifications();
  };

  const downloadExcel = async () => {
    setExporting(true);
    setError(null);
    try {
      const query = trialsApplicationsFilterToSearchParams(filters).toString();
      const exportUrl = query ? `${exportApiPath}?${query}` : exportApiPath;
      const response = await fetch(exportUrl, { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "jackals-vc-trial-signups.xlsx";
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError("Couldn't download the Excel sheet. Try again in a moment.");
    } finally {
      setExporting(false);
    }
  };

  const hasSecondaryFilters =
    filters.team !== "ALL" ||
    filters.position !== "ALL" ||
    filters.search.trim() !== "";

  const exportUsesFilters = hasTrialsApplicationsFilters(filters);

  const clearSecondaryFilters = () => {
    setTeamFilter("ALL");
    setPositionFilter("ALL");
    setSearch("");
  };

  return (
    <div className="space-y-4">
      {canEmailApplicants ? (
        <TrialsApplicantEmailPanel
          filteredApplications={filtered}
          filters={filters}
        />
      ) : null}

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-black/20 p-1.5 sm:grid-cols-4">
            {STATUS_TABS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setStatusFilter(option.id)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-sm font-medium transition sm:py-1.5",
                  statusFilter === option.id
                    ? "bg-jackals-red text-white"
                    : "text-zinc-400 hover:text-white",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
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
              className="w-full sm:w-auto"
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

        <div className="grid gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search…"
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Select
              value={teamFilter}
              onChange={(event) =>
                setTeamFilter(event.target.value as TeamFilter)
              }
            >
              <option value="ALL">All teams</option>
              {TRIALS_TEAM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              value={positionFilter}
              onChange={(event) =>
                setPositionFilter(event.target.value as PositionFilter)
              }
            >
              <option value="ALL">All positions</option>
              {TRIALS_POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>
            {filtered.length}{" "}
            {filtered.length === 1 ? "signup" : "signups"}
            {filtered.length !== applications.length
              ? ` of ${applications.length}`
              : ""}
          </span>
          {hasSecondaryFilters ? (
            <button
              type="button"
              onClick={clearSecondaryFilters}
              className="hover:text-zinc-300"
            >
              Clear search and filters
            </button>
          ) : null}
        </div>
      </div>

      <FormError message={error} />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <p className="font-display text-base font-semibold text-white">
            {applications.length === 0
              ? "No signups yet"
              : "No matching signups"}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {applications.length === 0
              ? "New sign-ups from the Trials page will appear here."
              : "Try a different status tab or clear your filters."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col />
                <col className="w-[7.5rem]" />
                <col className="w-[6.5rem]" />
                <col className="w-[5.5rem]" />
                <col className="w-[7.5rem]" />
              </colgroup>
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-2 py-2.5 font-medium">Name</th>
                  <th className="px-2 py-2.5 font-medium">Team</th>
                  <th className="px-2 py-2.5 font-medium">Position</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filtered.map((application) => {
                  const expanded = expandedId === application.id;
                  const loading = loadingId === application.id;

                  return (
                    <Fragment key={application.id}>
                      <tr className="bg-white/[0.015] transition hover:bg-white/[0.03]">
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expanded ? null : application.id)
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
                              {application.fullName}
                            </span>
                          </button>
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={cn(
                              "inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-medium",
                              teamAccent(application.tryingOutFor),
                            )}
                          >
                            {trialsTeamLabel(application.tryingOutFor)}
                          </span>
                        </td>
                        <td className="truncate px-2 py-2 text-zinc-400">
                          {trialsPositionLabel(application.preferredPosition1)}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                              statusAccent(application.status),
                            )}
                          >
                            {
                              TRIALS_APPLICATION_STATUS_LABELS[
                                application.status
                              ]
                            }
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <RowActions
                            application={application}
                            loading={loading}
                            canDeleteApplications={canDeleteApplications}
                            onAct={(id, action) => void act(id, action)}
                            onReviewDismissed={(id) => void reviewDismissed(id)}
                            onDeleteApplication={(id) =>
                              void deleteApplication(id)
                            }
                          />
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="bg-black/20">
                          <td colSpan={5} className="px-4 py-4">
                            <ExpandDetails application={application} />
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
            {filtered.map((application) => {
              const expanded = expandedId === application.id;
              const loading = loadingId === application.id;

              return (
                <article
                  key={application.id}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : application.id)
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
                          {application.fullName}
                        </span>
                      </button>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                            teamAccent(application.tryingOutFor),
                          )}
                        >
                          {trialsTeamLabel(application.tryingOutFor)}
                        </span>
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                            statusAccent(application.status),
                          )}
                        >
                          {
                            TRIALS_APPLICATION_STATUS_LABELS[
                              application.status
                            ]
                          }
                        </span>
                        <span className="text-xs text-zinc-500">
                          {trialsPositionLabel(application.preferredPosition1)}
                        </span>
                      </div>
                    </div>
                    <RowActions
                      application={application}
                      loading={loading}
                      canDeleteApplications={canDeleteApplications}
                      onAct={(id, action) => void act(id, action)}
                      onReviewDismissed={(id) => void reviewDismissed(id)}
                      onDeleteApplication={(id) => void deleteApplication(id)}
                    />
                  </div>
                  {expanded ? (
                    <div className="mt-3 border-t border-white/5 pt-3">
                      <ExpandDetails application={application} />
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
