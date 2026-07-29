"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  Download,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
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
import { apiGet, apiPatch } from "@/lib/client-api";
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
    return "bg-jackals-red/20 text-jackals-red-light";
  }
  if (tryingOutFor === "WOMENS_DIVISION_3") {
    return "bg-purple-500/20 text-purple-300";
  }
  return "bg-zinc-500/20 text-zinc-300";
}

function statusAccent(status: TrialsApplicationStatus) {
  if (status === "NEW") return "bg-amber-500/15 text-amber-300";
  if (status === "REVIEWED") return "bg-green-500/15 text-green-300";
  return "bg-zinc-500/15 text-zinc-300";
}

function ApplicationDetails({
  application,
}: {
  application: TrialsApplicationRecord;
}) {
  return (
    <dl className="mt-4 grid gap-2 border-t border-white/5 pt-4 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-zinc-500">INL division 25/26</dt>
        <dd className="text-zinc-200">
          {trialsInlDivisionLabel(application.inlDivision)}
          {application.inlDivisionOther
            ? ` — ${application.inlDivisionOther}`
            : ""}
        </dd>
      </div>
      {application.inlTeamName ? (
        <div>
          <dt className="text-zinc-500">INL team</dt>
          <dd className="text-zinc-200">{application.inlTeamName}</dd>
        </div>
      ) : null}
    </dl>
  );
}

function ActionButtons({
  application,
  loading,
  onAct,
}: {
  application: TrialsApplicationRecord;
  loading: boolean;
  onAct: (id: string, action: "review" | "dismiss") => void;
}) {
  if (application.status !== "NEW") return null;

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:gap-2">
      <Button
        type="button"
        size="sm"
        className="w-full sm:w-auto"
        disabled={loading}
        onClick={() => onAct(application.id, "review")}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Reviewed
          </>
        )}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full sm:w-auto"
        disabled={loading}
        onClick={() => onAct(application.id, "dismiss")}
      >
        <XCircle className="mr-1.5 h-4 w-4" />
        Dismiss
      </Button>
    </div>
  );
}

function ApplicationCard({
  application,
  loading,
  onAct,
}: {
  application: TrialsApplicationRecord;
  loading: boolean;
  onAct: (id: string, action: "review" | "dismiss") => void;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-base font-semibold text-white">
            {application.fullName}
          </h2>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              teamAccent(application.tryingOutFor),
            )}
          >
            {trialsTeamLabel(application.tryingOutFor)}
          </span>
          {application.status !== "NEW" ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                statusAccent(application.status),
              )}
            >
              {TRIALS_APPLICATION_STATUS_LABELS[application.status]}
            </span>
          ) : null}
        </div>

        <p className="mt-1 text-sm text-zinc-400">
          {trialsPositionLabel(application.preferredPosition1)} /{" "}
          {trialsPositionLabel(application.preferredPosition2)} ·{" "}
          {application.yearsExperience} yrs · age {application.age}
        </p>

        <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
          <Clock3 className="h-3.5 w-3.5 shrink-0" />
          {formatSubmittedAt(application.createdAt)}
        </p>

        <div className="mt-3 space-y-1.5 text-sm sm:flex sm:flex-wrap sm:gap-x-4 sm:gap-y-1 sm:space-y-0">
          <a
            href={`mailto:${application.contactEmail}`}
            className="flex items-center gap-1.5 break-all text-jackals-gold hover:underline"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {application.contactEmail}
          </a>
          <a
            href={`tel:${application.contactNumber}`}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white"
          >
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {application.contactNumber}
          </a>
        </div>

        <ApplicationDetails application={application} />
      </div>

      {application.status === "NEW" ? (
        <div className="mt-4 border-t border-white/5 pt-4">
          <ActionButtons
            application={application}
            loading={loading}
            onAct={onAct}
          />
        </div>
      ) : null}
    </article>
  );
}

export function TrialsApplicationsManager({
  initialApplications,
  listApiPath = "/api/admin/trials-applications",
  actionApiPath = "/api/admin/trials-applications",
  exportApiPath = "/api/admin/trials-applications/export",
}: {
  initialApplications: TrialsApplicationRecord[];
  listApiPath?: string;
  actionApiPath?: string;
  exportApiPath?: string;
}) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("NEW");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("ALL");
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("ALL");
  const [search, setSearch] = useState("");
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

        {hasSecondaryFilters ? (
          <button
            type="button"
            onClick={clearSecondaryFilters}
            className="text-xs text-zinc-500 transition hover:text-zinc-300"
          >
            Clear search and filters
          </button>
        ) : null}
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
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">
            {filtered.length}{" "}
            {filtered.length === 1 ? "signup" : "signups"}
          </p>
          {filtered.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              loading={loadingId === application.id}
              onAct={(id, action) => void act(id, action)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
