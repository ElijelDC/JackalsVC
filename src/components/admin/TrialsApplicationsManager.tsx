"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  Download,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  Phone,
  Rows3,
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
import { cn } from "@/lib/utils";

type LayoutMode = "cards" | "list" | "compact";
type StatusFilter = "ALL" | TrialsApplicationStatus;
type TeamFilter = "ALL" | (typeof TRIALS_TEAM_OPTIONS)[number]["value"];
type PositionFilter = "ALL" | (typeof TRIALS_POSITION_OPTIONS)[number]["value"];

function formatSubmittedAt(value: string) {
  return new Date(value).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSubmittedShort(value: string) {
  return new Date(value).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
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
    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-zinc-500">Age</dt>
        <dd className="text-white">{application.age}</dd>
      </div>
      <div>
        <dt className="text-zinc-500">Experience</dt>
        <dd className="text-white">{application.yearsExperience} years</dd>
      </div>
      <div>
        <dt className="text-zinc-500">INL division 25/26</dt>
        <dd className="text-white">
          {trialsInlDivisionLabel(application.inlDivision)}
          {application.inlDivisionOther
            ? ` — ${application.inlDivisionOther}`
            : ""}
        </dd>
      </div>
      {application.inlTeamName ? (
        <div>
          <dt className="text-zinc-500">INL team</dt>
          <dd className="text-white">{application.inlTeamName}</dd>
        </div>
      ) : null}
      <div>
        <dt className="text-zinc-500">Preferred position 1</dt>
        <dd className="text-white">
          {trialsPositionLabel(application.preferredPosition1)}
        </dd>
      </div>
      <div>
        <dt className="text-zinc-500">Preferred position 2</dt>
        <dd className="text-white">
          {trialsPositionLabel(application.preferredPosition2)}
        </dd>
      </div>
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
    <div className="flex shrink-0 flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        disabled={loading}
        onClick={() => onAct(application.id, "review")}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Reviewed
          </>
        )}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={() => onAct(application.id, "dismiss")}
      >
        <XCircle className="mr-2 h-4 w-4" />
        Dismiss
      </Button>
    </div>
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
  const [layout, setLayout] = useState<LayoutMode>("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("NEW");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("ALL");
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("ALL");
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      if (statusFilter !== "ALL" && application.status !== statusFilter) {
        return false;
      }
      if (teamFilter !== "ALL" && application.tryingOutFor !== teamFilter) {
        return false;
      }
      if (
        positionFilter !== "ALL" &&
        application.preferredPosition1 !== positionFilter &&
        application.preferredPosition2 !== positionFilter
      ) {
        return false;
      }
      if (!query) return true;

      const haystack = [
        application.fullName,
        application.contactEmail,
        application.contactNumber,
        application.inlTeamName ?? "",
        application.inlDivisionOther ?? "",
        trialsTeamLabel(application.tryingOutFor),
        trialsInlDivisionLabel(application.inlDivision),
        trialsPositionLabel(application.preferredPosition1),
        trialsPositionLabel(application.preferredPosition2),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [applications, statusFilter, teamFilter, positionFilter, search]);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);

    const result = await apiGet<{ applications: TrialsApplicationRecord[] }>(
      listApiPath,
      "refresh the trials applications list",
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
        ? "mark this application as reviewed"
        : "dismiss this application",
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
      const response = await fetch(exportApiPath, { credentials: "same-origin" });
      if (!response.ok) {
        throw new Error("Export failed");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "jackals-vc-trials-applications.xlsx";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't download the Excel sheet. Try again in a moment.");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setTeamFilter("ALL");
    setPositionFilter("ALL");
    setSearch("");
  };

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    teamFilter !== "ALL" ||
    positionFilter !== "ALL" ||
    search.trim() !== "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "NEW", label: "Pending" },
              { id: "ALL", label: "All" },
              { id: "REVIEWED", label: "Reviewed" },
              { id: "DISMISSED", label: "Dismissed" },
            ] as const
          ).map((option) => (
            <Button
              key={option.id}
              type="button"
              size="sm"
              variant={statusFilter === option.id ? "primary" : "outline"}
              onClick={() => setStatusFilter(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            {(
              [
                { id: "list", icon: List, label: "List" },
                { id: "cards", icon: LayoutGrid, label: "Cards" },
                { id: "compact", icon: Rows3, label: "Compact" },
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
                    ? "bg-jackals-red text-white"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white",
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
                Preparing
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Excel
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
            {refreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, team…"
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
        <div className="flex items-center gap-2">
          <p className="text-sm text-zinc-400">
            Showing{" "}
            <span className="font-medium text-white">{filtered.length}</span>
          </p>
          {hasActiveFilters ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearFilters}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <FormError message={error} />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/3 p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-400/80" />
          <p className="mt-4 font-display text-lg font-semibold text-white">
            No matching applications
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            {applications.length === 0
              ? "New applications from the Trials page will appear here."
              : "Try clearing filters or switching status."}
          </p>
        </div>
      ) : layout === "list" ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Positions</th>
                <th className="px-4 py-3 font-medium">Experience</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((application) => {
                const isLoading = loadingId === application.id;
                return (
                  <tr
                    key={application.id}
                    className="border-b border-white/5 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-white">
                        {application.fullName}
                      </p>
                      <a
                        href={`mailto:${application.contactEmail}`}
                        className="mt-1 block text-xs text-jackals-gold hover:underline"
                      >
                        {application.contactEmail}
                      </a>
                      <a
                        href={`tel:${application.contactNumber}`}
                        className="mt-0.5 block text-xs text-zinc-400"
                      >
                        {application.contactNumber}
                      </a>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          teamAccent(application.tryingOutFor),
                        )}
                      >
                        {trialsTeamLabel(application.tryingOutFor)}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-300">
                      {trialsPositionLabel(application.preferredPosition1)}
                      <span className="text-zinc-600"> / </span>
                      {trialsPositionLabel(application.preferredPosition2)}
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-300">
                      {application.yearsExperience} yrs · age {application.age}
                    </td>
                    <td className="px-4 py-3 align-top text-zinc-400">
                      {formatSubmittedShort(application.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          statusAccent(application.status),
                        )}
                      >
                        {TRIALS_APPLICATION_STATUS_LABELS[application.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ActionButtons
                        application={application}
                        loading={isLoading}
                        onAct={(id, action) => void act(id, action)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : layout === "compact" ? (
        <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
          {filtered.map((application) => {
            const isLoading = loadingId === application.id;
            return (
              <div
                key={application.id}
                className="flex flex-col gap-3 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">
                      {application.fullName}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        teamAccent(application.tryingOutFor),
                      )}
                    >
                      {trialsTeamLabel(application.tryingOutFor)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        statusAccent(application.status),
                      )}
                    >
                      {TRIALS_APPLICATION_STATUS_LABELS[application.status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-zinc-400">
                    {trialsPositionLabel(application.preferredPosition1)} /{" "}
                    {trialsPositionLabel(application.preferredPosition2)} ·{" "}
                    {application.yearsExperience} yrs ·{" "}
                    {application.contactEmail}
                  </p>
                </div>
                <ActionButtons
                  application={application}
                  loading={isLoading}
                  onAct={(id, action) => void act(id, action)}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((application) => {
            const isLoading = loadingId === application.id;

            return (
              <article
                key={application.id}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/3"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-semibold text-white">
                          {application.fullName}
                        </h2>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            teamAccent(application.tryingOutFor),
                          )}
                        >
                          {trialsTeamLabel(application.tryingOutFor)}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            statusAccent(application.status),
                          )}
                        >
                          {TRIALS_APPLICATION_STATUS_LABELS[application.status]}
                        </span>
                      </div>

                      <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                        <Clock3 className="h-3.5 w-3.5 shrink-0" />
                        Submitted {formatSubmittedAt(application.createdAt)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        <a
                          href={`mailto:${application.contactEmail}`}
                          className="inline-flex items-center gap-1.5 text-jackals-gold hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          {application.contactEmail}
                        </a>
                        <a
                          href={`tel:${application.contactNumber}`}
                          className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white"
                        >
                          <Phone className="h-4 w-4" />
                          {application.contactNumber}
                        </a>
                      </div>

                      <ApplicationDetails application={application} />
                    </div>

                    <ActionButtons
                      application={application}
                      loading={isLoading}
                      onAct={(id, action) => void act(id, action)}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
