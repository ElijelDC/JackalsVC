"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useRefreshAdminNotifications } from "@/components/admin/AdminNotificationsProvider";
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
  if (status === "NEW") return "text-amber-300 bg-amber-500/10";
  if (status === "REVIEWED") return "text-emerald-300 bg-emerald-500/10";
  return "text-zinc-400 bg-white/[0.06]";
}

function RowActions({
  application,
  loading,
  onAct,
}: {
  application: CoachingApplicationRecord;
  loading: boolean;
  onAct: (id: string, action: "review" | "dismiss") => void;
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
  application: CoachingApplicationRecord;
}) {
  return (
    <div className="grid gap-3 text-sm text-zinc-400 sm:grid-cols-2">
      <p>
        <span className="text-zinc-500">Age:</span> {application.age}
      </p>
      <p>
        <span className="text-zinc-500">Experience:</span>{" "}
        {application.yearsExperience} years
      </p>
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
      <p className="sm:col-span-2">
        <span className="text-zinc-500">Why interested:</span>{" "}
        <span className="mt-1 block whitespace-pre-wrap text-zinc-300">
          {application.whyInterested}
        </span>
      </p>
      <p className="text-xs text-zinc-600 sm:col-span-2">
        Submitted {formatSubmittedAt(application.createdAt)}
      </p>
    </div>
  );
}

export function CoachingApplicationsManager({
  initialApplications,
}: {
  initialApplications: CoachingApplicationRecord[];
}) {
  const router = useRouter();
  const refreshNotifications = useRefreshAdminNotifications();
  const [applications, setApplications] = useState(initialApplications);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("NEW");
  const [qualificationFilter, setQualificationFilter] =
    useState<QualificationFilter>("ALL");
  const [commuteFilter, setCommuteFilter] = useState<CommuteFilter>("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    void refreshNotifications();
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
    void refreshNotifications();
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
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid w-full grid-cols-2 gap-1.5 rounded-lg bg-black/20 p-1.5 sm:flex sm:w-auto sm:flex-wrap">
            {(
              [
                { id: "NEW", label: "Pending" },
                { id: "ALL", label: "All" },
                { id: "REVIEWED", label: "Reviewed" },
                { id: "DISMISSED", label: "Dismissed" },
              ] as const
            ).map((option) => (
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

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>
            {filtered.length} shown
            {filtered.length !== applications.length
              ? ` of ${applications.length}`
              : ""}
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="hover:text-zinc-300"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <FormError message={error} />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <p className="font-display text-base font-semibold text-white">
            No matching applications
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {applications.length === 0
              ? "New applications from the Coach With Us page will appear here."
              : "Try clearing filters or switching status."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col />
                <col className="w-[8rem]" />
                <col className="w-[6.5rem]" />
                <col className="w-[7.5rem]" />
              </colgroup>
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-2 py-2.5 font-medium">Name</th>
                  <th className="px-2 py-2.5 font-medium">Level</th>
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
                        <td className="truncate px-2 py-2 text-zinc-400">
                          {coachingQualificationLabel(
                            application.qualificationLevel,
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                              statusAccent(application.status),
                            )}
                          >
                            {
                              COACHING_APPLICATION_STATUS_LABELS[
                                application.status
                              ]
                            }
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <RowActions
                            application={application}
                            loading={loading}
                            onAct={(id, action) => void act(id, action)}
                          />
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="bg-black/20">
                          <td colSpan={4} className="px-4 py-4">
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
                            statusAccent(application.status),
                          )}
                        >
                          {
                            COACHING_APPLICATION_STATUS_LABELS[
                              application.status
                            ]
                          }
                        </span>
                        <span className="text-xs text-zinc-500">
                          {coachingQualificationLabel(
                            application.qualificationLevel,
                          )}
                        </span>
                      </div>
                    </div>
                    <RowActions
                      application={application}
                      loading={loading}
                      onAct={(id, action) => void act(id, action)}
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
