"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  LayoutGrid,
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
  COACHING_APPLICATION_STATUS_LABELS,
  type CoachingApplicationRecord,
  type CoachingApplicationStatus,
} from "@/lib/coaching-application-config";
import {
  COACHING_COMMUTE_OPTIONS,
  COACHING_QUALIFICATION_LEVELS,
  coachingCommuteLabel,
  coachingQualificationLabel,
} from "@/lib/coaching-recruitment-config";
import { apiGet, apiPatch } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type LayoutMode = "cards" | "compact";
type StatusFilter = "ALL" | CoachingApplicationStatus;
type QualificationFilter =
  | "ALL"
  | (typeof COACHING_QUALIFICATION_LEVELS)[number]["value"];
type CommuteFilter = "ALL" | (typeof COACHING_COMMUTE_OPTIONS)[number]["value"];

function formatSubmittedAt(value: string) {
  return new Date(value).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusAccent(status: CoachingApplicationStatus) {
  if (status === "NEW") return "bg-amber-500/15 text-amber-300";
  if (status === "REVIEWED") return "bg-green-500/15 text-green-300";
  return "bg-zinc-500/15 text-zinc-300";
}

function ApplicationDetails({
  application,
}: {
  application: CoachingApplicationRecord;
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
        <dt className="text-zinc-500">VLY Ireland coach level</dt>
        <dd className="text-white">
          {coachingQualificationLabel(application.qualificationLevel)}
        </dd>
      </div>
      <div>
        <dt className="text-zinc-500">Commute to both venues</dt>
        <dd className="text-white">
          {coachingCommuteLabel(application.canCommuteToBothVenues)}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-zinc-500">Why interested</dt>
        <dd className="mt-1 whitespace-pre-wrap text-white">
          {application.whyInterested}
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
  application: CoachingApplicationRecord;
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

export function CoachingApplicationsManager({
  initialApplications,
}: {
  initialApplications: CoachingApplicationRecord[];
}) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [layout, setLayout] = useState<LayoutMode>("cards");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("NEW");
  const [qualificationFilter, setQualificationFilter] =
    useState<QualificationFilter>("ALL");
  const [commuteFilter, setCommuteFilter] = useState<CommuteFilter>("ALL");
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      if (statusFilter !== "ALL" && application.status !== statusFilter) {
        return false;
      }
      if (
        qualificationFilter !== "ALL" &&
        application.qualificationLevel !== qualificationFilter
      ) {
        return false;
      }
      if (
        commuteFilter !== "ALL" &&
        application.canCommuteToBothVenues !== commuteFilter
      ) {
        return false;
      }
      if (!query) return true;

      const haystack = [
        application.fullName,
        application.contactEmail,
        application.contactNumber,
        application.whyInterested,
        coachingQualificationLabel(application.qualificationLevel),
        coachingCommuteLabel(application.canCommuteToBothVenues),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [applications, statusFilter, qualificationFilter, commuteFilter, search]);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);

    const result = await apiGet<{ applications: CoachingApplicationRecord[] }>(
      "/api/admin/coaching-applications",
      "refresh the coaching applications list",
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

    const result = await apiPatch<{ application: CoachingApplicationRecord }>(
      `/api/admin/coaching-applications/${id}`,
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

  const clearFilters = () => {
    setStatusFilter("ALL");
    setQualificationFilter("ALL");
    setCommuteFilter("ALL");
    setSearch("");
  };

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    qualificationFilter !== "ALL" ||
    commuteFilter !== "ALL" ||
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
            placeholder="Search name, email, notes…"
            className="pl-9"
          />
        </div>
        <Select
          value={qualificationFilter}
          onChange={(event) =>
            setQualificationFilter(event.target.value as QualificationFilter)
          }
        >
          <option value="ALL">All coach levels</option>
          {COACHING_QUALIFICATION_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </Select>
        <Select
          value={commuteFilter}
          onChange={(event) =>
            setCommuteFilter(event.target.value as CommuteFilter)
          }
        >
          <option value="ALL">All commute answers</option>
          {COACHING_COMMUTE_OPTIONS.map((option) => (
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
              ? "New applications from the Coach With Us page will appear here."
              : "Try clearing filters or switching status."}
          </p>
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
                        statusAccent(application.status),
                      )}
                    >
                      {COACHING_APPLICATION_STATUS_LABELS[application.status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-zinc-400">
                    {coachingQualificationLabel(application.qualificationLevel)}{" "}
                    · {application.yearsExperience} yrs ·{" "}
                    {coachingCommuteLabel(application.canCommuteToBothVenues)} ·{" "}
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
                            statusAccent(application.status),
                          )}
                        >
                          {COACHING_APPLICATION_STATUS_LABELS[application.status]}
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
