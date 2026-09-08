"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useRefreshAdminNotifications } from "@/components/admin/AdminNotificationsProvider";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Select } from "@/components/ui/Input";
import {
  COMMITTEE_INTEREST_STATUS_LABELS,
  committeeRoleLabel,
  type CommitteeInterestRecord,
  type CommitteeInterestStatus,
} from "@/lib/committee-roles-config";
import { apiGet, apiPatch } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | CommitteeInterestStatus;

function formatSubmittedAt(value: string) {
  return new Date(value).toLocaleString("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusAccent(status: CommitteeInterestStatus) {
  if (status === "NEW") return "text-amber-300 bg-amber-500/10";
  if (status === "REVIEWED") return "text-emerald-300 bg-emerald-500/10";
  return "text-zinc-400 bg-white/[0.06]";
}

export function CommitteeInterestsManager({
  initialInterests,
}: {
  initialInterests: CommitteeInterestRecord[];
}) {
  const router = useRouter();
  const refreshNotifications = useRefreshAdminNotifications();
  const [interests, setInterests] =
    useState<CommitteeInterestRecord[]>(initialInterests);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return interests.filter((interest) => {
      if (statusFilter !== "ALL" && interest.status !== statusFilter) {
        return false;
      }
      if (!needle) return true;
      const haystack = [
        interest.fullName,
        committeeRoleLabel(interest.roleInterest1),
        committeeRoleLabel(interest.roleInterest2),
        committeeRoleLabel(interest.roleInterest3),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [interests, query, statusFilter]);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    const result = await apiGet<{ interests: CommitteeInterestRecord[] }>(
      "/api/admin/committee-interests",
      "Failed to refresh committee interests",
    );
    setRefreshing(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInterests(result.data.interests);
    refreshNotifications();
  };

  const onAct = async (id: string, action: "review" | "dismiss") => {
    setActingId(id);
    setError(null);
    const result = await apiPatch<{ interest: CommitteeInterestRecord }>(
      `/api/admin/committee-interests/${id}`,
      { action },
      "Failed to update interest",
    );
    setActingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInterests((current) =>
      current.map((interest) =>
        interest.id === id ? result.data.interest : interest,
      ),
    );
    refreshNotifications();
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name or role"
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Status
            </label>
            <Select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="ALL">All</option>
              {(
                Object.keys(
                  COMMITTEE_INTEREST_STATUS_LABELS,
                ) as CommitteeInterestStatus[]
              ).map((status) => (
                <option key={status} value={status}>
                  {COMMITTEE_INTEREST_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={refresh}
          disabled={refreshing}
          className="shrink-0 gap-2"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <FormError message={error} />

      <p className="text-sm text-zinc-500">
        {filtered.length} of {interests.length} responses
      </p>

      <div className="overflow-hidden border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">
                Preferences
              </th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                Submitted
              </th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-zinc-500"
                >
                  No committee interests match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((interest) => {
                const expanded = expandedId === interest.id;
                const loading = actingId === interest.id;
                return (
                  <Fragment key={interest.id}>
                    <tr className="align-top hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expanded ? null : interest.id)
                          }
                          className="flex items-center gap-2 font-medium text-white"
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-zinc-500 transition-transform",
                              expanded && "rotate-180",
                            )}
                          />
                          {interest.fullName}
                        </button>
                        <p className="mt-1 text-xs text-zinc-500 md:hidden">
                          1. {committeeRoleLabel(interest.roleInterest1)}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">
                        <ol className="list-decimal space-y-0.5 pl-4">
                          <li>{committeeRoleLabel(interest.roleInterest1)}</li>
                          <li>{committeeRoleLabel(interest.roleInterest2)}</li>
                          <li>{committeeRoleLabel(interest.roleInterest3)}</li>
                        </ol>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                            statusAccent(interest.status),
                          )}
                        >
                          {COMMITTEE_INTEREST_STATUS_LABELS[interest.status]}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-zinc-500 sm:table-cell">
                        {formatSubmittedAt(interest.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {interest.status === "NEW" ? (
                            <>
                              <button
                                type="button"
                                title="Mark reviewed"
                                disabled={loading}
                                onClick={() => onAct(interest.id, "review")}
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
                                onClick={() => onAct(interest.id, "dismiss")}
                                className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white disabled:opacity-40"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-white/[0.015]">
                        <td colSpan={5} className="px-4 py-4">
                          <ol className="grid gap-2 text-sm text-zinc-400 sm:grid-cols-3">
                            <li>
                              <span className="text-zinc-500">1st:</span>{" "}
                              {committeeRoleLabel(interest.roleInterest1)}
                            </li>
                            <li>
                              <span className="text-zinc-500">2nd:</span>{" "}
                              {committeeRoleLabel(interest.roleInterest2)}
                            </li>
                            <li>
                              <span className="text-zinc-500">3rd:</span>{" "}
                              {committeeRoleLabel(interest.roleInterest3)}
                            </li>
                          </ol>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
